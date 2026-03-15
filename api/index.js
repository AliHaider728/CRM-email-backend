import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import clientRoutes       from '../src/routes/clients.js';
import emailRoutes        from '../src/routes/emails.js';
import teamRoutes         from '../src/routes/team.js';
import statsRoutes        from '../src/routes/stats.js';
import timelineRoutes     from '../src/routes/timeline.js';
import notificationRoutes from '../src/routes/notifications.js';
import bccRoutes          from '../src/routes/bcc.js';
import outlookRoutes      from '../src/routes/outlook.js';
import { errorHandler }   from '../src/middleware/errorHandler.js';

// ─── App─────────────
const app = express();

// ─── CORS────────────
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

// ─── Body Parser─────
app.use(express.json({ limit: '10mb' }));

// ─── Health──────────
app.get('/api/health', (_req, res) =>
  res.json({
    status: ' API Running Successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    availableRoutes: [
      { method: 'GET',    path: '/api/health' },

      // Clients
      { method: 'GET',    path: '/api/clients' },
      { method: 'POST',   path: '/api/clients' },
      { method: 'GET',    path: '/api/clients/:id' },
      { method: 'PUT',    path: '/api/clients/:id' },
      { method: 'DELETE', path: '/api/clients/:id' },

      // Emails
      { method: 'GET',    path: '/api/emails' },
      { method: 'POST',   path: '/api/emails' },
      { method: 'GET',    path: '/api/emails/:id' },
      { method: 'DELETE', path: '/api/emails/:id' },

      // Team
      { method: 'GET',    path: '/api/team' },
      { method: 'POST',   path: '/api/team' },
      { method: 'GET',    path: '/api/team/:id' },
      { method: 'PUT',    path: '/api/team/:id' },
      { method: 'DELETE', path: '/api/team/:id' },

      // Stats
      { method: 'GET',    path: '/api/stats/overview' },

      // Timeline & Notes
      { method: 'GET',    path: '/api/clients/:id/timeline' },
      { method: 'POST',   path: '/api/notes' },
      { method: 'DELETE', path: '/api/notes/:id' },

      // Notifications
      { method: 'GET',    path: '/api/notifications' },
      { method: 'PUT',    path: '/api/notifications/:id/read' },
      { method: 'DELETE', path: '/api/notifications/:id' },

      // BCC
      { method: 'GET',    path: '/api/bcc' },
      { method: 'POST',   path: '/api/bcc' },

      // Outlook
      { method: 'GET',    path: '/api/outlook/auth' },
      { method: 'GET',    path: '/api/outlook/callback' },
      { method: 'GET',    path: '/api/outlook/emails' },
    ],
  })
);

// ─── Routes──────────
app.use('/api/clients',       clientRoutes);
app.use('/api/emails',        emailRoutes);
app.use('/api/team',          teamRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api',               timelineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bcc',           bccRoutes);
app.use('/api/outlook',       outlookRoutes);

// ─── 404─────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'not_found', message: 'Route not found' })
);

// ─── Error Handler───
app.use(errorHandler);

// ─── DB Connection───
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined.');
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB connected.');
}

// ─── Vercel Serverless Handler 
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

// ─── Local Dev Server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`CPR Email API → http://localhost:${PORT}`);
      console.log(`Health Check  → http://localhost:${PORT}/api/health`);
    });
  }).catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
}