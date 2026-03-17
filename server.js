import dotenv from "dotenv";
dotenv.config();

import express    from "express";
import cors       from "cors";
import mongoose   from "mongoose";

import clientRoutes       from "./src/routes/clients.js";
import emailRoutes        from "./src/routes/emails.js";
import teamRoutes         from "./src/routes/team.js";
import statsRoutes        from "./src/routes/stats.js";
import timelineRoutes     from "./src/routes/timeline.js";
import notificationRoutes from "./src/routes/notifications.js";
import bccRoutes          from "./src/routes/bcc.js";
import outlookRoutes      from "./src/routes/outlook.js";
import trackingRoutes     from "./src/routes/tracking.js";        
import { errorHandler }   from "./src/middleware/errorHandler.js";

const app = express();

// ─── CORS 
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://cps-dashbaord-crm.vercel.app",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Body Parser
app.use(express.json({ limit: "10mb" }));

// ─── Root
app.get("/", (req, res) => {
  res.json({ name: "CRM Email API", version: "1.1.0", health: "/api/health" });
});

// ─── Health─────
app.get("/api/health", (req, res) => {
  res.json({ status: "API Running Successfully ", timestamp: new Date().toISOString() });
});

// ─── Routes─────
app.use("/api/clients",       clientRoutes);
app.use("/api/emails",        emailRoutes);
app.use("/api/team",          teamRoutes);
app.use("/api/stats",         statsRoutes);
app.use("/api",               timelineRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bcc",           bccRoutes);
app.use("/api/outlook",       outlookRoutes);
app.use("/api/track",         trackingRoutes);    // ← NEW — pixel + link tracking

// ─── 404─
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

app.use(errorHandler);

// ─── MongoDB (serverless optimised) 
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ─── Vercel handler ───
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

// ─── Local dev──
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  connectDB()
    .then(() => app.listen(PORT, () => {
      console.log(`Server → http://localhost:${PORT}`);
      console.log(`Tracking pixel → http://localhost:${PORT}/api/track/open/:emailId/:recipientEmail`);
    }))
    .catch((err) => { console.error(err); process.exit(1); });
}