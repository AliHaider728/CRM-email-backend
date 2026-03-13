const Notification = require('../models/Notification');

// GET /api/notifications
async function listNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = unreadOnly ? { isRead: false } : {};

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ isRead: false }),
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (err) { next(err); }
}

// POST /api/notifications/:notificationId/read
async function markRead(req, res, next) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'not_found', message: 'Notification not found' });
    res.json(notification);
  } catch (err) { next(err); }
}

module.exports = { listNotifications, markRead };
