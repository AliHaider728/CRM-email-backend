// ─────────────────────────────────────────────────────────────────────────────
// controllers/bccController.js
// Handles inbound BCC emails sent to activity+<member>@ourcrm.com
//
// This endpoint is called by your email receiving service (e.g. SendGrid
// Inbound Parse, Mailgun, or Postmark Inbound).  It:
//   1. Parses the BCC address to identify the account manager
//   2. Looks up the correct client via the recipient (To) email
//   3. Logs the email under that client's timeline
//   4. Creates a notification for the account manager
//
// Route: POST /api/bcc/ingest
// ─────────────────────────────────────────────────────────────────────────────

import TeamMember    from '../models/TeamMember.js';
import Client        from '../models/Client.js';
import Email         from '../models/Email.js';
import TimelineEntry from '../models/TimelineEntry.js';
import Notification  from '../models/Notification.js';

// ─── POST /api/bcc/ingest ─────────────────────────────────────────────────────
export async function ingestBccEmail(req, res, next) {
  try {
    const {
      from,          // sender email e.g. "alice@nhscrm.com"
      fromName,      // sender display name
      to,            // primary recipient email (client)
      toName,        // recipient display name
      bcc,           // the BCC address e.g. "activity+alice@ourcrm.com"
      subject,
      bodyPlain,
      bodyHtml,
      attachments = [],
      outlookMessageId,
    } = req.body;

    if (!bcc || !from || !subject) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'bcc, from, and subject are required',
      });
    }

    // 1. Identify account manager from BCC address
    //    BCC format: activity+<username>@ourcrm.com  OR  bcc+<username>@crm.yourdomain.com
    const member = await TeamMember.findOne({ bccAddress: bcc });
    if (!member) {
      return res.status(404).json({
        error: 'not_found',
        message: `No team member found with BCC address: ${bcc}`,
      });
    }

    // 2. Find client by their email address (To field)
    let client = null;
    if (to) {
      client = await Client.findOne({ email: to.toLowerCase() });
    }
    // Fallback: try matching the sender against client emails (reply scenario)
    if (!client && from) {
      client = await Client.findOne({ email: from.toLowerCase() });
    }

    // 3. Prevent duplicate ingestion for same Outlook message
    if (outlookMessageId) {
      const existing = await Email.findOne({ outlookMessageId });
      if (existing) {
        return res.json({ success: true, duplicate: true, emailId: existing._id });
      }
    }

    // 4. Build preview (first 200 chars of plain text)
    const bodyPreview = (bodyPlain || '').replace(/\s+/g, ' ').trim().slice(0, 200);

    // 5. Save email
    const email = await Email.create({
      subject,
      direction:          'outbound',
      fromEmail:          from,
      fromName:           fromName || from,
      toEmail:            to,
      toName:             toName || to,
      body:               bodyHtml || bodyPlain,
      bodyPreview,
      clientId:           client?._id,
      accountManagerId:   member._id,
      accountManagerName: member.name,
      bccTracked:         true,
      syncMethod:         'bcc',
      outlookMessageId,
      attachments:        attachments.map((a) => a.filename || a),
      isRead:             true,
      sentAt:             new Date(),
    });

    // 6. Mirror to timeline
    if (client) {
      await TimelineEntry.create({
        type:               'email_sent',
        clientId:           client._id,
        emailId:            email._id,
        subject,
        preview:            bodyPreview,
        fromName:           fromName || from,
        fromEmail:          from,
        accountManagerId:   member._id,
        accountManagerName: member.name,
        syncMethod:         'bcc',
        isRead:             true,
        occurredAt:         new Date(),
      });

      // 7. Update client counters
      await Client.findByIdAndUpdate(client._id, {
        $inc: { emailCount: 1 },
        $set: { lastContactedAt: new Date() },
      });
    }

    // 8. Update team member sent counter
    await TeamMember.findByIdAndUpdate(member._id, {
      $inc: { emailCount: 1, sentCount: 1 },
    });

    res.status(201).json({ success: true, emailId: email._id, clientFound: !!client });
  } catch (err) { next(err); }
}