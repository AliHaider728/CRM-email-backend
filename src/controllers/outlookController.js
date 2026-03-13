const TeamMember   = require('../models/TeamMember');
const Notification = require('../models/Notification');

/**
 * POST /api/outlook/sync
 *
 * Production: use @microsoft/microsoft-graph-client to:
 *   1. Exchange auth code for tokens (OAuth2 PKCE flow)
 *   2. Call https://graph.microsoft.com/v1.0/me/messages
 *   3. Parse and log each email via the email controller
 *
 * This stub simulates a successful sync response so the frontend
 * and notification system work in development without Azure credentials.
 *
 * See OUTLOOK_SETUP.md for full Azure setup instructions.
 */
async function triggerSync(req, res, next) {
  try {
    const { memberId } = req.body;

    if (memberId) {
      await TeamMember.findByIdAndUpdate(memberId, { outlookConnected: true });
    }

    await Notification.create({
      type: 'sync_complete',
      title: 'Outlook sync complete',
      message: 'Your inbox has been synced successfully. All new emails have been logged.',
    });

    res.json({
      success: true,
      message: 'Outlook sync triggered. New emails will appear in the timeline shortly.',
    });
  } catch (err) { next(err); }
}

module.exports = { triggerSync };
