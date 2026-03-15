// ─────────────────────────────────────────────────────────────────────────────
// controllers/statsController.js
// Aggregates dashboard statistics across emails, clients, and team members.
// Route: GET /api/stats/overview
// ─────────────────────────────────────────────────────────────────────────────

import Email         from '../models/Email.js';
import Client        from '../models/Client.js';
import TeamMember    from '../models/TeamMember.js';
import TimelineEntry from '../models/TimelineEntry.js';

// ─── GET /api/stats/overview ──────────────────────────────────────────────────
// Returns aggregated statistics used by the dashboard:
//   - totalEmailsSent / totalEmailsReceived
//   - openRate / clickRate (percentage of sent emails that were opened/clicked)
//   - activeClients count
//   - teamMembersActive (Outlook connected)
//   - emailsThisWeek / emailsThisMonth
//   - recentActivity (last 10 timeline entries for the activity feed)
export async function getOverview(_req, res, next) {
  try {
    const now      = new Date();
    const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Run all DB queries in parallel for maximum performance
    const [
      totalSent, totalReceived,
      emailsThisWeek, emailsThisMonth,
      activeClients, teamMembersActive,
      openedEmails, clickedEmails,
      openAgg, clickAgg,
      recentActivity,
    ] = await Promise.all([
      // Total sent vs received emails
      Email.countDocuments({ direction: 'outbound' }),
      Email.countDocuments({ direction: 'inbound' }),

      // Volume over time windows
      Email.countDocuments({ createdAt: { $gte: weekAgo } }),
      Email.countDocuments({ createdAt: { $gte: monthAgo } }),

      // Counts of active clients and synced team members
      Client.countDocuments(),
      TeamMember.countDocuments({ outlookConnected: true }),

      // Engagement: how many sent emails were opened/clicked at least once
      Email.countDocuments({ openCount:  { $gt: 0 } }),
      Email.countDocuments({ clickCount: { $gt: 0 } }),

      // Aggregate total open / click event counts across all emails
      Email.aggregate([{ $group: { _id: null, total: { $sum: '$openCount'  } } }]),
      Email.aggregate([{ $group: { _id: null, total: { $sum: '$clickCount' } } }]),

      // Latest 10 timeline entries for the dashboard activity feed
      TimelineEntry.find().sort({ occurredAt: -1 }).limit(10),
    ]);

    // Calculate rates as percentage of total sent emails
    const openRate  = totalSent > 0 ? Math.round((openedEmails  / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((clickedEmails / totalSent) * 100) : 0;

    res.json({
      totalEmailsSent:     totalSent,
      totalEmailsReceived: totalReceived,
      totalOpens:          openAgg[0]?.total  ?? 0,
      totalClicks:         clickAgg[0]?.total ?? 0,
      openRate,
      clickRate,
      activeClients,
      teamMembersActive,
      emailsThisWeek,
      emailsThisMonth,
      recentActivity,
    });
  } catch (err) { next(err); }
}