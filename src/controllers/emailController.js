const Email        = require('../models/Email');
const Client       = require('../models/Client');
const TeamMember   = require('../models/TeamMember');
const TimelineEntry= require('../models/TimelineEntry');
const Notification = require('../models/Notification');

// GET /api/emails
async function listEmails(req, res, next) {
  try {
    const { clientId, accountManagerId, status } = req.query;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (clientId)        filter.clientId        = clientId;
    if (accountManagerId)filter.accountManagerId= accountManagerId;
    if (status === 'opened')   filter.openCount  = { $gt: 0 };
    else if (status === 'clicked') filter.clickCount = { $gt: 0 };
    else if (status === 'sent')    filter.direction  = 'outbound';
    else if (status === 'received')filter.direction  = 'inbound';

    const [emails, total] = await Promise.all([
      Email.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Email.countDocuments(filter),
    ]);
    res.json({ emails, total, page, limit });
  } catch (err) { next(err); }
}

// POST /api/emails
async function logEmail(req, res, next) {
  try {
    const { subject, direction, fromEmail, fromName, toEmail, toName, body, bodyPreview,
            clientId, accountManagerId, accountManagerName, bccTracked, outlookMessageId, sentAt, receivedAt } = req.body;

    if (!subject || !direction) {
      return res.status(400).json({ error: 'validation_error', message: 'subject and direction are required' });
    }

    const email = await Email.create({
      subject, direction, fromEmail, fromName, toEmail, toName, body, bodyPreview,
      clientId, accountManagerId, accountManagerName,
      bccTracked: bccTracked || false,
      outlookMessageId,
      openCount: 0, clickCount: 0, isRead: false, attachments: [],
      sentAt: sentAt ? new Date(sentAt) : undefined,
      receivedAt: receivedAt ? new Date(receivedAt) : undefined,
    });

    if (clientId) {
      await Client.findByIdAndUpdate(clientId, { $inc: { emailCount: 1 }, lastContactedAt: new Date() });
      await TimelineEntry.create({
        type: direction === 'outbound' ? 'email_sent' : 'email_received',
        clientId, emailId: email._id,
        subject, preview: bodyPreview || (body && body.slice(0, 120)),
        fromName, fromEmail, accountManagerId, accountManagerName,
        isRead: false, openCount: 0, clickCount: 0, hasAttachments: false,
        occurredAt: sentAt ? new Date(sentAt) : receivedAt ? new Date(receivedAt) : new Date(),
      });
    }
    if (accountManagerId) {
      await TeamMember.findByIdAndUpdate(accountManagerId, { $inc: { emailCount: 1 } });
    }
    if (direction === 'inbound' && clientId) {
      const client = await Client.findById(clientId);
      await Notification.create({
        type: 'email_received',
        title: 'New email received',
        message: `Subject: ${subject}`,
        clientId, clientName: client && client.name,
        emailId: email._id,
      });
    }

    res.status(201).json(email);
  } catch (err) { next(err); }
}

// GET /api/emails/:emailId
async function getEmail(req, res, next) {
  try {
    const email = await Email.findById(req.params.emailId);
    if (!email) return res.status(404).json({ error: 'not_found', message: 'Email not found' });
    res.json(email);
  } catch (err) { next(err); }
}

// POST /api/emails/:emailId/track
async function trackEmail(req, res, next) {
  try {
    const { eventType } = req.body;
    if (!['open', 'click'].includes(eventType)) {
      return res.status(400).json({ error: 'validation_error', message: 'eventType must be "open" or "click"' });
    }

    const update = eventType === 'open' ? { $inc: { openCount: 1 } } : { $inc: { clickCount: 1 } };
    const email = await Email.findByIdAndUpdate(req.params.emailId, update, { new: true });
    if (!email) return res.status(404).json({ error: 'not_found', message: 'Email not found' });

    const client = email.clientId ? await Client.findById(email.clientId) : null;
    await Notification.create({
      type: eventType === 'open' ? 'email_opened' : 'email_clicked',
      title: eventType === 'open' ? 'Email opened by client' : 'Link clicked in email',
      message: `Subject: ${email.subject}`,
      clientId: email.clientId, clientName: client && client.name,
      emailId: email._id,
    });

    res.json(email);
  } catch (err) { next(err); }
}

module.exports = { listEmails, logEmail, getEmail, trackEmail };
