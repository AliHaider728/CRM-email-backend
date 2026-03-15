// ─────────────────────────────────────────────────────────────────────────────
// controllers/bccController.js
// Handles inbound BCC email ingestion from external email services.
// Route: POST /api/bcc/ingest
//
// ── How BCC Tracking Works ────────────────────────────────────────────────────
// Each team member has a unique BCC address: bcc+<username>@crm.yourdomain.com
// When they send a client email in Outlook, they add this address as BCC.
// The email server (SendGrid Inbound Parse / Postmark / Mailgun) POSTs the
// parsed email payload to this endpoint.
// We then:
//   1. Look up the team member from the bccToken in the "to" address
//   2. Match the recipient email to an existing client record
//   3. Log the email and create a timeline entry
// ─────────────────────────────────────────────────────────────────────────────

import Email         from '../models/Email.js';
import Client        from '../models/Client.js';
import TeamMember    from '../models/TeamMember.js';
import TimelineEntry from '../models/TimelineEntry.js';

// ─── POST /api/bcc/ingest ─────────────────────────────────────────────────────
// Ingests an email forwarded via BCC from an external email service.
// Body: { bccToken*, subject*, fromEmail*, fromName, toEmail,
//         body, bodyPreview, sentAt }
export async function ingestBccEmail(req, res, next) {
  try {
    const {
      bccToken, subject, fromEmail, fromName,
      toEmail, body, bodyPreview, sentAt,
    } = req.body;

    // bccToken, subject, and fromEmail are required to process the email
    if (!bccToken || !subject || !fromEmail)
      return res.status(400).json({
        error: 'validation_error',
        message: 'bccToken, subject, and fromEmail are required',
      });

    // Reconstruct the full BCC address from the token to find the team member
    const bccAddress = `bcc+${bccToken}@crm.yourdomain.com`;
    const member     = await TeamMember.findOne({ bccAddress });

    // Try to match the recipient's email address to an existing client
    const client = toEmail ? await Client.findOne({ email: toEmail }) : null;

    // Create the email record — always logged even if client/member not found
    const email = await Email.create({
      subject,
      direction:          'outbound',
      fromEmail, fromName,
      toEmail,
      body, bodyPreview,
      clientId:           client?._id,
      accountManagerId:   member?._id,
      accountManagerName: member?.name,
      bccTracked:  true,
      openCount:   0,
      clickCount:  0,
      isRead:      true,
      attachments: [],
      sentAt: sentAt ? new Date(sentAt) : new Date(),
    });

    // If we matched a client: update their email count and create a timeline entry
    if (client) {
      await Client.findByIdAndUpdate(client._id, {
        $inc: { emailCount: 1 },
        lastContactedAt: new Date(),
      });

      await TimelineEntry.create({
        type:               'email_sent',
        clientId:           client._id,
        emailId:            email._id,
        subject,
        preview:            bodyPreview || body?.slice(0, 120),
        fromName, fromEmail,
        accountManagerId:   member?._id,
        accountManagerName: member?.name,
        isRead:         true,
        openCount:      0,
        clickCount:     0,
        hasAttachments: false,
        occurredAt:     email.sentAt,
      });
    }

    res.status(201).json({ success: true, email });
  } catch (err) { next(err); }
}