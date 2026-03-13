const Email        = require('../models/Email');
const TeamMember   = require('../models/TeamMember');
const Client       = require('../models/Client');
const TimelineEntry= require('../models/TimelineEntry');

/**
 * POST /api/bcc/ingest
 *
 * Called by your email server (SendGrid Inbound Parse, Postmark, Mailgun, etc.)
 * when an email with a BCC token arrives.
 *
 * The bccToken in the "to" address identifies which team member sent the email.
 * Example: bcc+alice@crm.yourdomain.com → look up TeamMember by bccAddress.
 */
async function ingestBccEmail(req, res, next) {
  try {
    const { bccToken, subject, fromEmail, fromName, toEmail, body, bodyPreview, sentAt } = req.body;

    if (!bccToken || !subject || !fromEmail) {
      return res.status(400).json({ error: 'validation_error', message: 'bccToken, subject, fromEmail are required' });
    }

    // Resolve which team member the BCC token belongs to
    const bccAddress = `bcc+${bccToken}@crm.yourdomain.com`;
    const member = await TeamMember.findOne({ bccAddress });

    // Try to match the recipient email to an existing client
    const client = toEmail ? await Client.findOne({ email: toEmail }) : null;

    const email = await Email.create({
      subject,
      direction: 'outbound',
      fromEmail, fromName,
      toEmail,
      body, bodyPreview,
      clientId: client ? client._id : undefined,
      accountManagerId:   member ? member._id   : undefined,
      accountManagerName: member ? member.name  : undefined,
      bccTracked: true,
      openCount: 0, clickCount: 0, isRead: true, attachments: [],
      sentAt: sentAt ? new Date(sentAt) : new Date(),
    });

    if (client) {
      await Client.findByIdAndUpdate(client._id, { $inc: { emailCount: 1 }, lastContactedAt: new Date() });
      await TimelineEntry.create({
        type: 'email_sent', clientId: client._id, emailId: email._id,
        subject, preview: bodyPreview || (body && body.slice(0, 120)),
        fromName, fromEmail,
        accountManagerId: member ? member._id : undefined,
        accountManagerName: member ? member.name : undefined,
        isRead: true, openCount: 0, clickCount: 0, hasAttachments: false,
        occurredAt: email.sentAt,
      });
    }

    res.status(201).json({ success: true, email });
  } catch (err) { next(err); }
}

module.exports = { ingestBccEmail };
