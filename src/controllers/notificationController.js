// ─────────────────────────────────────────────────────────────────────────────
// controllers/notificationController.js
// Manages real-time notifications for email events (opens, clicks, replies).
// Routes:
//   GET  /api/notifications
//   POST /api/notifications/:notificationId/read
// ─────────────────────────────────────────────────────────────────────────────

import Notification from '../models/Notification.js';

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Returns a paginated list of notifications, newest first.
// Query params:
//   unreadOnly – 'true' to return only unread notifications
//   page, limit – pagination (defaults: page=1, limit=20)
// Response includes unreadCount so the UI badge stays accurate.
export async function listNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // When unreadOnly=true, only return unseen notifications
    const filter = unreadOnly ? { isRead: false } : {};

    // Fetch notifications, total count, and global unread count in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ isRead: false }),  // always the full unread count
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (err) { next(err); }
}

// ─── POST /api/notifications/:notificationId/read ─────────────────────────────
// Marks a single notification as read.
// Called when the user clicks the check icon on a notification card.
export async function markRead(req, res, next) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }   // return the updated document
    );

    if (!notification)
      return res.status(404).json({ error: 'not_found', message: 'Notification not found' });

    res.json(notification);
  } catch (err) { next(err); }
}