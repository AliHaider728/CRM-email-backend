// 
// controllers/emailController.js
// 

import Email            from '../models/Email.js';
import EmailEngagement  from '../models/EmailEngagement.js';
import Client           from '../models/Client.js';
import TeamMember       from '../models/TeamMember.js';
import TimelineEntry    from '../models/TimelineEntry.js';
import Notification     from '../models/Notification.js';

// ─── Helper: parse device from User-Agent string
function parseDevice(ua = '') {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (s.includes('mobile') || s.includes('android') || s.includes('iphone')) return 'mobile';
  if (s.includes('tablet') || s.includes('ipad'))  return 'tablet';
  if (s.includes('windows') || s.includes('macintosh') || s.includes('linux')) return 'desktop';
  return 'unknown';
}

// ─── Helper: parse OS from User-Agent 
function parseOS(ua = '') {
  if (!ua) return 'Unknown';
  if (ua.includes('iPhone') || ua.includes('iPad'))   return 'iOS';
  if (ua.includes('Android'))  return 'Android';
  if (ua.includes('Windows'))  return 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux'))    return 'Linux';
  return 'Unknown';
}

// ─── Helper: parse browser from User-Agent 
function parseBrowser(ua = '') {
  if (!ua) return 'Unknown';
  if (ua.includes('Edg/'))    return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Chromium')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome'))   return 'Safari';
  if (ua.includes('OPR/') || ua.includes('Opera/'))       return 'Opera';
  return 'Unknown';
}

// 
// GET /api/emails
// Returns paginated list of emails with optional filters.
// Query: clientId, accountManagerId, status, page, limit
// 
export async function listEmails(req, res, next) {
  try {
    const { clientId, accountManagerId, status } = req.query;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (clientId)         filter.clientId         = clientId;
    if (accountManagerId) filter.accountManagerId = accountManagerId;

    if (status === 'opened')        filter.openCount     = { $gt: 0 };
    else if (status === 'clicked')  filter.clickCount    = { $gt: 0 };
    else if (status === 'sent')     filter.direction     = 'outbound';
    else if (status === 'received') filter.direction     = 'inbound';

    const [emails, total] = await Promise.all([
      Email.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Email.countDocuments(filter),
    ]);

    res.json({ emails, total, page, limit });
  } catch (err) { next(err); }
}

// 
// POST /api/emails
// Logs a new email (sent or received).
// Body: { subject*, direction*, fromEmail, fromName, toEmail, toName,
//         body, bodyPreview, clientId, accountManagerId, accountManagerName,
//         bccTracked, syncMethod, outlookMessageId, sentAt, receivedAt }
// 
export async function logEmail(req, res, next) {
  try {
    const {
      subject, direction, fromEmail, fromName, toEmail, toName,
      body, bodyPreview, clientId, accountManagerId, accountManagerName,
      bccTracked, syncMethod, outlookMessageId, sentAt, receivedAt,
    } = req.body;

    if (!subject || !direction)
      return res.status(400).json({
        error: 'validation_error',
        message: 'subject and direction are required',
      });

    const email = await Email.create({
      subject, direction, fromEmail, fromName, toEmail, toName,
      body, bodyPreview, clientId, accountManagerId, accountManagerName,
      bccTracked:      bccTracked  || false,
      syncMethod:      syncMethod  || (bccTracked ? 'bcc' : 'manual'),
      outlookMessageId,
      openCount: 0, clickCount: 0, downloadCount: 0,
      uniqueOpenCount: 0, isRead: false, attachments: [],
      sentAt:     sentAt     ? new Date(sentAt)     : undefined,
      receivedAt: receivedAt ? new Date(receivedAt) : undefined,
    });

    if (clientId) {
      await Client.findByIdAndUpdate(clientId, {
        $inc: { emailCount: 1 },
        lastContactedAt: new Date(),
      });

      await TimelineEntry.create({
        type:      direction === 'outbound' ? 'email_sent' : 'email_received',
        clientId,  emailId: email._id,
        subject,   preview: bodyPreview || body?.slice(0, 120),
        fromName,  fromEmail,
        accountManagerId, accountManagerName,
        syncMethod: syncMethod || (bccTracked ? 'bcc' : 'outlook_sync'),
        isRead: false, openCount: 0, clickCount: 0, hasAttachments: false,
        occurredAt: sentAt
          ? new Date(sentAt)
          : receivedAt
          ? new Date(receivedAt)
          : new Date(),
      });
    }

    if (accountManagerId) {
      const incField = direction === 'outbound' ? 'sentCount' : 'receivedCount';
      await TeamMember.findByIdAndUpdate(accountManagerId, {
        $inc: { emailCount: 1, [incField]: 1 },
      });
    }

    if (direction === 'inbound' && clientId) {
      const client = await Client.findById(clientId);
      await Notification.create({
        type:       'reply_received',
        title:      `Reply from ${client?.name || 'client'}`,
        message:    `Subject: ${subject}`,
        clientId,
        clientName: client?.name,
        emailId:    email._id,
        accountManagerName,
      });
    }

    res.status(201).json(email);
  } catch (err) { next(err); }
}

// 
// GET /api/emails/:emailId
// Returns single email with its full engagement detail.
// 
export async function getEmail(req, res, next) {
  try {
    const email = await Email.findById(req.params.emailId);
    if (!email)
      return res.status(404).json({ error: 'not_found', message: 'Email not found' });

    // Attach engagement breakdown
    const engagements = await EmailEngagement.find({ emailId: email._id }).sort({ occurredAt: -1 });

    res.json({
      ...email.toObject(),
      engagements: {
        opens:     engagements.filter(e => e.type === 'open'),
        clicks:    engagements.filter(e => e.type === 'click'),
        downloads: engagements.filter(e => e.type === 'download'),
      },
    });
  } catch (err) { next(err); }
}

// 
// GET /api/emails/:emailId/engagements
// Returns full WHO-opened detail for a specific email.
// Used by the frontend drawer to show "Opened by dr.smith@surgery.com on iPhone"
// 
export async function getEmailEngagements(req, res, next) {
  try {
    const email = await Email.findById(req.params.emailId);
    if (!email)
      return res.status(404).json({ error: 'not_found', message: 'Email not found' });

    const engagements = await EmailEngagement
      .find({ emailId: req.params.emailId })
      .sort({ occurredAt: -1 });

    const opens     = engagements.filter(e => e.type === 'open');
    const clicks    = engagements.filter(e => e.type === 'click');
    const downloads = engagements.filter(e => e.type === 'download');

    // Unique openers by email address
    const uniqueOpeners = [...new Set(opens.map(e => e.openedByEmail).filter(Boolean))];

    res.json({
      emailId:  req.params.emailId,
      subject:  email.subject,
      summary: {
        openCount:      opens.length,
        clickCount:     clicks.length,
        downloadCount:  downloads.length,
        uniqueOpeners:  uniqueOpeners.length,
        lastOpenedAt:   opens[0]?.occurredAt || null,
        lastOpenedBy:   opens[0]?.openedByEmail || null,
      },
      opens,        // full detail: who, device, OS, location, when
      clicks,       // full detail: which URL, device, when
      downloads,    // full detail: which file, device, when
    });
  } catch (err) { next(err); }
}

// 
// POST /api/emails/:emailId/track
// Called from API — records open/click/download with WHO info.
// Body: { eventType: 'open'|'click'|'download', openedByEmail?, linkUrl?, fileName? }
// 
export async function trackEmail(req, res, next) {
  try {
    const { eventType, openedByEmail, openedByName, linkUrl, fileName, fileSize } = req.body;

    if (!['open', 'click', 'download'].includes(eventType))
      return res.status(400).json({
        error: 'validation_error',
        message: 'eventType must be "open", "click", or "download"',
      });

    const email = await Email.findById(req.params.emailId);
    if (!email)
      return res.status(404).json({ error: 'not_found', message: 'Email not found' });

    const ua     = req.headers['user-agent'] || '';
    const ip     = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const device = parseDevice(ua);
    const os     = parseOS(ua);
    const browser = parseBrowser(ua);

    // Check if this IP already opened (for unique count)
    const alreadyOpened = eventType === 'open'
      ? await EmailEngagement.exists({ emailId: email._id, type: 'open', openedByEmail: openedByEmail || ip })
      : false;

    // Create detailed engagement record
    await EmailEngagement.create({
      emailId:       email._id,
      clientId:      email.clientId,
      accountManagerId: email.accountManagerId,
      type:          eventType,
      openedByEmail: openedByEmail || null,
      openedByName:  openedByName  || null,
      ipAddress:     ip,
      userAgent:     ua,
      device,
      os,
      browser,
      linkUrl:       linkUrl   || null,
      fileName:      fileName  || null,
      fileSize:      fileSize  || null,
      occurredAt:    new Date(),
    });

    // Update email counters atomically
    const counterUpdate = {};
    if (eventType === 'open') {
      counterUpdate.$inc = { openCount: 1 };
      counterUpdate.$set = { lastOpenedAt: new Date(), lastOpenedBy: openedByEmail || ip };
      if (!alreadyOpened) counterUpdate.$inc.uniqueOpenCount = 1;
    } else if (eventType === 'click') {
      counterUpdate.$inc = { clickCount: 1 };
      counterUpdate.$set = { lastClickedAt: new Date() };
    } else {
      counterUpdate.$inc = { downloadCount: 1 };
    }

    const updatedEmail = await Email.findByIdAndUpdate(
      req.params.emailId,
      counterUpdate,
      { new: true }
    );

    // Update timeline entry counts too
    await TimelineEntry.findOneAndUpdate(
      { emailId: email._id },
      { $inc: { [`${eventType === 'open' ? 'open' : eventType === 'click' ? 'click' : 'download'}Count`]: 1 } }
    );

    // Create notification
    const client = email.clientId ? await Client.findById(email.clientId) : null;

    const notifMap = {
      open:     { type: 'email_opened',    title: `Email opened`,         message: `"${email.subject}" was opened${openedByEmail ? ` by ${openedByEmail}` : ''} on ${device}` },
      click:    { type: 'link_clicked',    title: `Link clicked`,         message: `A link in "${email.subject}" was clicked${openedByEmail ? ` by ${openedByEmail}` : ''}` },
      download: { type: 'file_downloaded', title: `File downloaded`,      message: `"${fileName || 'A file'}" was downloaded from "${email.subject}"` },
    };

    const notif = notifMap[eventType];
    await Notification.create({
      type:               notif.type,
      title:              notif.title,
      message:            notif.message,
      clientId:           email.clientId,
      clientName:         client?.name,
      emailId:            email._id,
      accountManagerName: email.accountManagerName,
      meta: {
        openedByEmail, device, os, browser, linkUrl, fileName,
      },
    });

    res.json({ success: true, email: updatedEmail });
  } catch (err) { next(err); }
}

// 
// GET /api/track/open/:emailId/:recipientEmail
// Tracking PIXEL endpoint — called when email is opened in email client.
// Returns 1x1 transparent GIF. Logs the open event silently.
// 
export async function trackPixel(req, res) {
  try {
    const { emailId, recipientEmail } = req.params;
    const email = await Email.findById(emailId);

    if (email) {
      const ua      = req.headers['user-agent'] || '';
      const ip      = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
      const device  = parseDevice(ua);
      const os      = parseOS(ua);
      const browser = parseBrowser(ua);

      const decoded = decodeURIComponent(recipientEmail);

      // Check unique
      const alreadyOpened = await EmailEngagement.exists({
        emailId: email._id, type: 'open', openedByEmail: decoded,
      });

      await EmailEngagement.create({
        emailId: email._id, clientId: email.clientId,
        accountManagerId: email.accountManagerId,
        type: 'open', openedByEmail: decoded,
        ipAddress: ip, userAgent: ua, device, os, browser,
        occurredAt: new Date(),
      });

      const counterUpdate = {
        $inc: { openCount: 1 },
        $set: { lastOpenedAt: new Date(), lastOpenedBy: decoded },
      };
      if (!alreadyOpened) counterUpdate.$inc.uniqueOpenCount = 1;

      await Email.findByIdAndUpdate(emailId, counterUpdate);
      await TimelineEntry.findOneAndUpdate(
        { emailId: email._id },
        { $inc: { openCount: 1 }, $set: { lastOpenedAt: new Date() } }
      );

      // Fire notification only on first open
      if (!alreadyOpened) {
        const client = email.clientId ? await Client.findById(email.clientId) : null;
        await Notification.create({
          type:       'email_opened',
          title:      `Email opened`,
          message:    `"${email.subject}" was opened by ${decoded} on ${device}`,
          clientId:   email.clientId,
          clientName: client?.name,
          emailId:    email._id,
          accountManagerName: email.accountManagerName,
          meta: { openedByEmail: decoded, device, os, browser, ip },
        });
      }
    }
  } catch (_) {
    // Never let tracking errors break the pixel response
  }

  // Always return 1×1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res
    .set('Content-Type',  'image/gif')
    .set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    .set('Pragma',        'no-cache')
    .send(pixel);
}

// 
// GET /api/track/click/:emailId
// Link tracking redirect — wraps links so clicks are logged.
// Query: ?url=<original_url>&email=<recipientEmail>
// 
export async function trackClick(req, res) {
  try {
    const { emailId }  = req.params;
    const { url, email: recipientEmail } = req.query;
    const email = await Email.findById(emailId);

    if (email && url) {
      const ua     = req.headers['user-agent'] || '';
      const ip     = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
      const device = parseDevice(ua);
      const os     = parseOS(ua);
      const browser = parseBrowser(ua);
      const decoded = decodeURIComponent(recipientEmail || '');
      const decodedUrl = decodeURIComponent(url);

      await EmailEngagement.create({
        emailId: email._id, clientId: email.clientId,
        accountManagerId: email.accountManagerId,
        type: 'click', openedByEmail: decoded || null,
        ipAddress: ip, userAgent: ua, device, os, browser,
        linkUrl: decodedUrl, occurredAt: new Date(),
      });

      await Email.findByIdAndUpdate(emailId, {
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: new Date() },
      });

      await TimelineEntry.findOneAndUpdate(
        { emailId: email._id },
        { $inc: { clickCount: 1 } }
      );

      const client = email.clientId ? await Client.findById(email.clientId) : null;
      await Notification.create({
        type:       'link_clicked',
        title:      'Link clicked in email',
        message:    `A link in "${email.subject}" was clicked${decoded ? ` by ${decoded}` : ''}`,
        clientId:   email.clientId,
        clientName: client?.name,
        emailId:    email._id,
        accountManagerName: email.accountManagerName,
        meta: { openedByEmail: decoded, device, os, browser, linkUrl: decodedUrl },
      });

      // Redirect to original URL
      return res.redirect(decodedUrl);
    }
  } catch (_) {}

  // Fallback if something goes wrong
  res.redirect(decodeURIComponent(req.query.url || '/'));
}