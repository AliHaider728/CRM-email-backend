// ─────────────────────────────────────────────────────────────────────────────
// controllers/timelineController.js
// Manages the per-client activity timeline and manual note logging.
// Routes:
//   GET  /api/clients/:clientId/timeline
//   POST /api/notes
// ─────────────────────────────────────────────────────────────────────────────

import TimelineEntry from '../models/TimelineEntry.js';

// ─── GET /api/clients/:clientId/timeline ─────────────────────────────────────
// Returns a paginated, filtered timeline for a specific client.
// Query params:
//   type  – filter by entry type: 'email_sent' | 'email_received' | 'note' | 'engagement' | 'all'
//   page, limit – pagination (defaults: page=1, limit=50)
// Results sorted newest first (occurredAt: -1).
export async function getTimeline(req, res, next) {
  try {
    const { type } = req.query;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    // Always scope to the requested client
    const filter = { clientId: req.params.clientId };

    // Apply optional type filter — 'all' means no type filter
    if (type && type !== 'all') filter.type = type;

    const [entries, total] = await Promise.all([
      TimelineEntry.find(filter).skip(skip).limit(limit).sort({ occurredAt: -1 }),
      TimelineEntry.countDocuments(filter),
    ]);

    res.json({ entries, total, page, limit });
  } catch (err) { next(err); }
}

// ─── POST /api/notes ──────────────────────────────────────────────────────────
// Manually logs an internal note against a client.
// Notes appear in the timeline alongside emails and engagements.
// Body: { clientId*, content*, accountManagerId, accountManagerName }
export async function addNote(req, res, next) {
  try {
    const { clientId, content, accountManagerId, accountManagerName } = req.body;

    // clientId and content are required
    if (!clientId || !content)
      return res.status(400).json({
        error: 'validation_error',
        message: 'clientId and content are required',
      });

    const entry = await TimelineEntry.create({
      type: 'note',
      clientId,
      content,
      accountManagerId,
      accountManagerName,
      isRead:         true,   // notes are always considered read immediately
      openCount:      0,
      clickCount:     0,
      hasAttachments: false,
      occurredAt:     new Date(),
    });

    res.status(201).json(entry);
  } catch (err) { next(err); }
}