// ─────────────────────────────────────────────────────────────────────────────
// controllers/outlookController.js
// Handles Microsoft Outlook sync integration.
// Route: POST /api/outlook/sync
//
// ── Production Setup ──────────────────────────────────────────────────────────
// To enable real Outlook sync, use @microsoft/microsoft-graph-client:
//   1. Register an Azure AD app and obtain clientId + clientSecret
//   2. Implement OAuth2 PKCE flow to get an access token per team member
//   3. Call GET https://graph.microsoft.com/v1.0/me/messages to fetch emails
//   4. For each message, call POST /api/emails to log it in the CRM
//   5. Store refresh tokens in TeamMember.outlookRefreshToken (add to schema)
//
// This stub simulates a successful sync so the frontend and notification
// pipeline work correctly in development without Azure credentials.
// See OUTLOOK_SETUP.md for full production setup instructions.
// ─────────────────────────────────────────────────────────────────────────────

import TeamMember   from '../models/TeamMember.js';
import Notification from '../models/Notification.js';

// ─── POST /api/outlook/sync ───────────────────────────────────────────────────
// Triggers an Outlook mailbox sync for a team member.
// Body: { memberId } – optional; if provided, marks that member as connected.
// On success: updates member status, creates a sync_complete notification.
export async function triggerSync(req, res, next) {
  try {
    const { memberId } = req.body;

    // If a memberId was sent, mark that team member as Outlook-connected
    // and record the sync timestamp
    if (memberId) {
      await TeamMember.findByIdAndUpdate(memberId, {
        outlookConnected: true,
        lastSyncAt: new Date(),
      });
    }

    // Create a notification so all users see the sync completed
    await Notification.create({
      type:    'sync_complete',
      title:   'Outlook sync complete',
      message: 'Your inbox has been synced successfully. All new emails have been logged.',
    });

    res.json({
      success: true,
      message: 'Outlook sync triggered. New emails will appear in the timeline shortly.',
    });
  } catch (err) { next(err); }
}