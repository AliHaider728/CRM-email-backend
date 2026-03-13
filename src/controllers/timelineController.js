const TimelineEntry = require('../models/TimelineEntry');

// GET /api/clients/:clientId/timeline
async function getTimeline(req, res, next) {
  try {
    const { type } = req.query;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const filter = { clientId: req.params.clientId };
    if (type && type !== 'all') filter.type = type;

    const [entries, total] = await Promise.all([
      TimelineEntry.find(filter).skip(skip).limit(limit).sort({ occurredAt: -1 }),
      TimelineEntry.countDocuments(filter),
    ]);

    res.json({ entries, total, page, limit });
  } catch (err) { next(err); }
}

// POST /api/notes
async function addNote(req, res, next) {
  try {
    const { clientId, content, accountManagerId, accountManagerName } = req.body;
    if (!clientId || !content) {
      return res.status(400).json({ error: 'validation_error', message: 'clientId and content are required' });
    }
    const entry = await TimelineEntry.create({
      type: 'note',
      clientId, content, accountManagerId, accountManagerName,
      isRead: true, openCount: 0, clickCount: 0, hasAttachments: false,
      occurredAt: new Date(),
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

module.exports = { getTimeline, addNote };
