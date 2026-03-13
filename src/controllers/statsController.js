const Email        = require('../models/Email');
const Client       = require('../models/Client');
const TeamMember   = require('../models/TeamMember');
const TimelineEntry= require('../models/TimelineEntry');

// GET /api/stats/overview
async function getOverview(_req, res, next) {
  try {
    const now      = new Date();
    const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSent, totalReceived,
      emailsThisWeek, emailsThisMonth,
      activeClients, teamMembersActive,
      openedEmails, clickedEmails,
      openAgg, clickAgg,
      recentActivity,
    ] = await Promise.all([
      Email.countDocuments({ direction: 'outbound' }),
      Email.countDocuments({ direction: 'inbound' }),
      Email.countDocuments({ createdAt: { $gte: weekAgo } }),
      Email.countDocuments({ createdAt: { $gte: monthAgo } }),
      Client.countDocuments(),
      TeamMember.countDocuments({ outlookConnected: true }),
      Email.countDocuments({ openCount:  { $gt: 0 } }),
      Email.countDocuments({ clickCount: { $gt: 0 } }),
      Email.aggregate([{ $group: { _id: null, total: { $sum: '$openCount'  } } }]),
      Email.aggregate([{ $group: { _id: null, total: { $sum: '$clickCount' } } }]),
      TimelineEntry.find().sort({ occurredAt: -1 }).limit(10),
    ]);

    const openRate  = totalSent > 0 ? Math.round((openedEmails  / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((clickedEmails / totalSent) * 100) : 0;

    res.json({
      totalEmailsSent:      totalSent,
      totalEmailsReceived:  totalReceived,
      totalOpens:           openAgg[0]  ? openAgg[0].total  : 0,
      totalClicks:          clickAgg[0] ? clickAgg[0].total : 0,
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

module.exports = { getOverview };
