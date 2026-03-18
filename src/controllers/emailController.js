// ─────────────────────────────────────────────────────────────────────────────
// controllers/emailController.js
// ─────────────────────────────────────────────────────────────────────────────

import Email           from '../models/Email.js';
import EmailEngagement from '../models/EmailEngagement.js';
import TimelineEntry   from '../models/TimelineEntry.js';
import Notification    from '../models/Notification.js';
import Client          from '../models/Client.js';
import { parseUserAgent } from '../utils/parseUserAgent.js';

// 1×1 transparent GIF for pixel tracking
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// ─── GET /api/emails  
export async function listEmails(req, res, next) {
  try {
    const {
      clientId, accountManagerId, direction,
      page = 1, limit = 20,
    } = req.query;

    const filter = {};
    if (clientId)         filter.clientId         = clientId;
    if (accountManagerId) filter.accountManagerId = accountManagerId;
    if (direction)        filter.direction         = direction;

    const skip = (Number(page) - 1) * Number(limit);

    const [emails, total] = await Promise.all([
      Email.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Email.countDocuments(filter),
    ]);

    res.json({ emails, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

// ─── POST /api/emails 
export async function logEmail(req, res, next) {
  try {
    const email = await Email.create(req.body);

    // Mirror into timeline
    await TimelineEntry.create({
      type:               email.direction === 'outbound' ? 'email_sent' : 'email_received',
      clientId:           email.clientId,
      emailId:            email._id,
      subject:            email.subject,
      preview:            email.bodyPreview,
      fromName:           email.fromName,
      fromEmail:          email.fromEmail,
      accountManagerId:   email.accountManagerId,
      accountManagerName: email.accountManagerName,
      syncMethod:         email.syncMethod,
      isRead:             email.isRead,
      occurredAt:         email.sentAt || email.receivedAt || new Date(),
    });

    // Bump client counters
    if (email.clientId) {
      const inc = email.direction === 'inbound'
        ? { emailCount: 1, unreadCount: 1, lastContactedAt: new Date() }
        : { emailCount: 1, lastContactedAt: new Date() };
      await Client.findByIdAndUpdate(email.clientId, { $inc: inc });
    }

    res.status(201).json(email);
  } catch (err) { next(err); }
}

// ─── GET /api/emails/:emailId  
export async function getEmail(req, res, next) {
  try {
    const email = await Email.findById(req.params.emailId);
    if (!email) return res.status(404).json({ error: 'not_found', message: 'Email not found' });
    res.json(email);
  } catch (err) { next(err); }
}

// ─── POST /api/emails/:emailId/track  
// Manual engagement logging from frontend / Postman
export async function trackEmail(req, res, next) {
  try {
    const { type, openedByEmail, openedByName, device, os, browser,
            location, linkUrl, fileName, fileSize, ipAddress } = req.body;

    const email = await Email.findById(req.params.emailId);
    if (!email) return res.status(404).json({ error: 'not_found', message: 'Email not found' });

    await _recordEngagement({
      email, type, openedByEmail, openedByName,
      device, os, browser, location, linkUrl, fileName, fileSize, ipAddress,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
}

// ─── GET /api/emails/:emailId/engagements  
export async function getEmailEngagements(req, res, next) {
  try {
    const engagements = await EmailEngagement
      .find({ emailId: req.params.emailId })
      .sort({ occurredAt: -1 });
    res.json({ engagements });
  } catch (err) { next(err); }
}

// ─── GET /api/track/open/:emailId/:recipientEmail 
// Pixel tracking — called when email is opened (img src)
// Returns a 1×1 transparent GIF so email clients don't show a broken image
export async function trackPixel(req, res, next) {
  try {
    // Always return the pixel FIRST so the email client isn't kept waiting
    res.set({
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma':        'no-cache',
      'Expires':       '0',
    });
    res.end(TRACKING_PIXEL);

    // Then process the engagement async (fire-and-forget, never blocks response)
    const { emailId, recipientEmail } = req.params;
    const email = await Email.findById(emailId).lean();
    if (!email) return;   // silently ignore unknown emailIds

    const ua     = req.headers['user-agent'] || '';
    const parsed = parseUserAgent(ua);

    await _recordEngagement({
      email,
      type:           'open',
      openedByEmail:  decodeURIComponent(recipientEmail),
      ipAddress:      req.ip || req.headers['x-forwarded-for'],
      userAgent:      ua,
      device:         parsed.device,
      os:             parsed.os,
      browser:        parsed.browser,
    });
  } catch (err) {
    // Swallow errors — pixel already sent, never throw 500 to email client
    console.error('[trackPixel]', err.message);
  }
}

// ─── GET /api/track/click/:emailId?url=...&email=...  
// Link click tracking — redirect user to the real URL after logging
export async function trackClick(req, res, next) {
  try {
    const { emailId }      = req.params;
    const { url, email: recipientEmail } = req.query;

    if (!url) return res.status(400).json({ error: 'url query param is required' });

    // Redirect user immediately so they don't notice the tracking hop
    res.redirect(302, url);

    // Log async
    const email = await Email.findById(emailId).lean();
    if (!email) return;

    const ua     = req.headers['user-agent'] || '';
    const parsed = parseUserAgent(ua);

    await _recordEngagement({
      email,
      type:          'click',
      openedByEmail: recipientEmail ? decodeURIComponent(recipientEmail) : undefined,
      linkUrl:       url,
      ipAddress:     req.ip || req.headers['x-forwarded-for'],
      userAgent:     ua,
      device:        parsed.device,
      os:            parsed.os,
      browser:       parsed.browser,
    });
  } catch (err) {
    console.error('[trackClick]', err.message);
  }
}

// ─── Internal helper: record engagement + update counters + push notification ─
async function _recordEngagement({ email, type, openedByEmail, openedByName,
  device, os, browser, location, linkUrl, fileName, fileSize, ipAddress, userAgent }) {

  // 1. Save raw engagement event
  await EmailEngagement.create({
    emailId:          email._id,
    clientId:         email.clientId,
    accountManagerId: email.accountManagerId,
    type,
    openedByEmail,
    openedByName,
    device:    device   || 'unknown',
    os,
    browser,
    location,
    ipAddress,
    userAgent,
    linkUrl,
    fileName,
    fileSize,
    occurredAt: new Date(),
  });

  // 2. Update email counters
  const update = {};
  if (type === 'open') {
    update.$inc = { openCount: 1 };
    update.$set = { lastOpenedAt: new Date(), lastOpenedBy: openedByEmail };

    // Unique opener check
    const alreadyOpened = await EmailEngagement.exists({
      emailId:       email._id,
      type:          'open',
      openedByEmail,
    });
    if (!alreadyOpened) update.$inc.uniqueOpenCount = 1;
  }
  if (type === 'click')    update.$inc = { ...(update.$inc || {}), clickCount: 1 };
  if (type === 'download') update.$inc = { ...(update.$inc || {}), downloadCount: 1 };

  await Email.findByIdAndUpdate(email._id, update);

  // 3. Create notification for the account manager
  const notifMap = {
    open:     { type: 'email_opened',    title: 'Email opened',      msg: `"${email.subject}" opened by ${openedByEmail || 'a recipient'}` },
    click:    { type: 'link_clicked',    title: 'Link clicked',      msg: `A link in "${email.subject}" was clicked${openedByEmail ? ` by ${openedByEmail}` : ''}` },
    download: { type: 'file_downloaded', title: 'File downloaded',   msg: `${fileName || 'A file'} was downloaded from "${email.subject}"` },
  };

  const n = notifMap[type];
  if (n) {
    await Notification.create({
      type:               n.type,
      title:              n.title,
      message:            n.msg,
      clientId:           email.clientId,
      emailId:            email._id,
      accountManagerName: email.accountManagerName,
      meta: { openedByEmail, device, os, browser, location, linkUrl, fileName },
    });
  }
}