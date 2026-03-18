//  
// controllers/outlookController.js
// Microsoft Graph API — OAuth2 + inbox sync
//
// Routes:
//   GET  /api/outlook/auth/:memberId      → redirect to Microsoft login
//   GET  /api/outlook/callback            → handle OAuth callback, store token
//   POST /api/outlook/sync                → manually trigger sync for a member
//   GET  /api/outlook/status/:memberId    → check connection status
//  

import axios        from 'axios';
import TeamMember   from '../models/TeamMember.js';
import Email        from '../models/Email.js';
import Client       from '../models/Client.js';
import TimelineEntry from '../models/TimelineEntry.js';
import Notification from '../models/Notification.js';

const {
  OUTLOOK_CLIENT_ID,
  OUTLOOK_CLIENT_SECRET,
  OUTLOOK_TENANT_ID,
  OUTLOOK_REDIRECT_URI,
} = process.env;

const GRAPH_BASE     = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE      = `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}`;
const OUTLOOK_SCOPES = 'openid profile email Mail.Read offline_access';

// ─── GET /api/outlook/auth/:memberId ───
// Initiates OAuth2 flow — redirects the team member to Microsoft login page.
export function initiateAuth(req, res) {
  const { memberId } = req.params;

  const params = new URLSearchParams({
    client_id:     OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  OUTLOOK_REDIRECT_URI,
    scope:         OUTLOOK_SCOPES,
    state:         memberId,   // pass memberId through OAuth state param
    prompt:        'select_account',
  });

  res.redirect(`${AUTH_BASE}/oauth2/v2.0/authorize?${params}`);
}

// ─── GET /api/outlook/callback  
// Microsoft redirects here after login. Exchange code for tokens.
export async function handleCallback(req, res, next) {
  try {
    const { code, state: memberId, error } = req.query;

    if (error) {
      return res.status(400).json({ error, message: req.query.error_description });
    }
    if (!code || !memberId) {
      return res.status(400).json({ error: 'missing_params', message: 'code and state required' });
    }

    // Exchange auth code for access + refresh tokens
    const tokenRes = await axios.post(
      `${AUTH_BASE}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id:     OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  OUTLOOK_REDIRECT_URI,
        scope:         OUTLOOK_SCOPES,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Save tokens + mark connected
    await TeamMember.findByIdAndUpdate(memberId, {
      outlookConnected:    true,
      outlookRefreshToken: refresh_token,
      lastSyncAt:          new Date(),
    });

    // Kick off initial sync right away
    await _syncMemberEmails(memberId, access_token);

    // Redirect to frontend success page
    const frontendBase = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5173';
    res.redirect(`${frontendBase}/email-activity?outlook=connected`);
  } catch (err) { next(err); }
}

// ─── POST /api/outlook/sync 
// Manual sync trigger. Body: { memberId }
export async function triggerSync(req, res, next) {
  try {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId required' });

    const member = await TeamMember.findById(memberId);
    if (!member) return res.status(404).json({ error: 'not_found', message: 'Team member not found' });

    if (!member.outlookConnected || !member.outlookRefreshToken) {
      return res.status(400).json({
        error:       'not_connected',
        message:     'Outlook is not connected for this team member.',
        authUrl:     `/api/outlook/auth/${memberId}`,
      });
    }

    // Refresh the access token first
    const accessToken = await _refreshAccessToken(member);

    // Run sync
    const synced = await _syncMemberEmails(memberId, accessToken);

    res.json({
      success: true,
      message: `Sync complete. ${synced} new emails logged.`,
      syncedCount: synced,
    });
  } catch (err) { next(err); }
}

// ─── GET /api/outlook/status/:memberId 
export async function getStatus(req, res, next) {
  try {
    const member = await TeamMember.findById(req.params.memberId)
      .select('name email outlookConnected lastSyncAt');
    if (!member) return res.status(404).json({ error: 'not_found' });
    res.json(member);
  } catch (err) { next(err); }
}

// ─── Internal: refresh access token using stored refresh token 
async function _refreshAccessToken(member) {
  const tokenRes = await axios.post(
    `${AUTH_BASE}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id:     OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: member.outlookRefreshToken,
      scope:         OUTLOOK_SCOPES,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token } = tokenRes.data;

  // Update stored refresh token (Microsoft rotates it)
  await TeamMember.findByIdAndUpdate(member._id, {
    outlookRefreshToken: refresh_token,
    lastSyncAt:          new Date(),
  });

  return access_token;
}

// ─── Internal: sync inbox messages for a team member  
async function _syncMemberEmails(memberId, accessToken) {
  const member  = await TeamMember.findById(memberId);
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch last 50 messages from inbox (sent + received)
  const [sentRes, inboxRes] = await Promise.all([
    axios.get(`${GRAPH_BASE}/me/mailFolders/SentItems/messages?$top=50&$orderby=sentDateTime desc`, { headers }),
    axios.get(`${GRAPH_BASE}/me/mailFolders/Inbox/messages?$top=50&$orderby=receivedDateTime desc`, { headers }),
  ]);

  const allMessages = [
    ...sentRes.data.value.map((m) => ({ ...m, _direction: 'outbound' })),
    ...inboxRes.data.value.map((m) => ({ ...m, _direction: 'inbound' })),
  ];

  let syncedCount = 0;

  for (const msg of allMessages) {
    // Skip if already imported
    if (await Email.exists({ outlookMessageId: msg.id })) continue;

    // Try to match to a known client
    const counterpartEmail = msg._direction === 'outbound'
      ? msg.toRecipients?.[0]?.emailAddress?.address
      : msg.from?.emailAddress?.address;

    const client = counterpartEmail
      ? await Client.findOne({ email: counterpartEmail.toLowerCase() })
      : null;

    const bodyPreview = (msg.bodyPreview || '').slice(0, 200);

    const email = await Email.create({
      subject:            msg.subject || '(no subject)',
      direction:          msg._direction,
      fromEmail:          msg.from?.emailAddress?.address,
      fromName:           msg.from?.emailAddress?.name,
      toEmail:            msg.toRecipients?.[0]?.emailAddress?.address,
      toName:             msg.toRecipients?.[0]?.emailAddress?.name,
      bodyPreview,
      clientId:           client?._id,
      accountManagerId:   member._id,
      accountManagerName: member.name,
      bccTracked:         false,
      syncMethod:         'outlook_sync',
      outlookMessageId:   msg.id,
      isRead:             msg.isRead ?? true,
      sentAt:             msg._direction === 'outbound' ? new Date(msg.sentDateTime) : undefined,
      receivedAt:         msg._direction === 'inbound'  ? new Date(msg.receivedDateTime) : undefined,
    });

    // Timeline entry
    if (client) {
      await TimelineEntry.create({
        type:               msg._direction === 'outbound' ? 'email_sent' : 'email_received',
        clientId:           client._id,
        emailId:            email._id,
        subject:            email.subject,
        preview:            bodyPreview,
        fromName:           email.fromName,
        fromEmail:          email.fromEmail,
        accountManagerId:   member._id,
        accountManagerName: member.name,
        syncMethod:         'outlook_sync',
        isRead:             email.isRead,
        occurredAt:         email.sentAt || email.receivedAt || new Date(),
      });

      // If inbound reply — create a notification
      if (msg._direction === 'inbound') {
        await Notification.create({
          type:               'reply_received',
          title:              `Reply from ${client.name}`,
          message:            `Re: ${email.subject} — ${email.fromName || email.fromEmail} replied.`,
          clientId:           client._id,
          clientName:         client.name,
          emailId:            email._id,
          accountManagerName: member.name,
        });

        await Client.findByIdAndUpdate(client._id, {
          $inc: { emailCount: 1, unreadCount: 1 },
          $set: { lastContactedAt: new Date() },
        });
      }
    }

    syncedCount++;
  }

  // Create summary notification
  if (syncedCount > 0) {
    await Notification.create({
      type:    'sync_complete',
      title:   'Outlook sync complete',
      message: `${syncedCount} new email${syncedCount > 1 ? 's' : ''} synced from ${member.name}'s inbox.`,
    });
  }

  await TeamMember.findByIdAndUpdate(memberId, {
    $inc: { emailCount: syncedCount },
    $set: { lastSyncAt: new Date() },
  });

  return syncedCount;
}