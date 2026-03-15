import express  from 'express';
import cors     from 'cors';

import clientRoutes       from './routes/clients.js';
import emailRoutes        from './routes/emails.js';
import teamRoutes         from './routes/team.js';
import statsRoutes        from './routes/stats.js';
import timelineRoutes     from './routes/timeline.js';
import notificationRoutes from './routes/notifications.js';
import bccRoutes          from './routes/bcc.js';
import outlookRoutes      from './routes/outlook.js';
import { errorHandler }   from './middleware/errorHandler.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://cps-dashbaord-crm.vercel.app',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/clients',       clientRoutes);
app.use('/api/emails',        emailRoutes);
app.use('/api/team',          teamRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api',               timelineRoutes);   // /api/clients/:id/timeline  +  /api/notes
app.use('/api/notifications', notificationRoutes);
app.use('/api/bcc',           bccRoutes);
app.use('/api/outlook',       outlookRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'not_found', message: 'Route not found' })
);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;