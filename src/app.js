const express = require('express');
const cors = require('cors');

const clientRoutes = require('./routes/clients');
const emailRoutes = require('./routes/emails');
const teamRoutes = require('./routes/team');
const statsRoutes = require('./routes/stats');
const timelineRoutes = require('./routes/timeline');
const notificationRoutes = require('./routes/notifications');
const bccRoutes = require('./routes/bcc');
const outlookRoutes = require('./routes/outlook');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/clients', clientRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', timelineRoutes);          // /api/clients/:id/timeline + /api/notes
app.use('/api/notifications', notificationRoutes);
app.use('/api/bcc', bccRoutes);
app.use('/api/outlook', outlookRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
