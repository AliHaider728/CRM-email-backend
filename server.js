import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import clientRoutes from "./src/routes/clients.js";
import emailRoutes from "./src/routes/emails.js";
import teamRoutes from "./src/routes/team.js";
import statsRoutes from "./src/routes/stats.js";
import timelineRoutes from "./src/routes/timeline.js";
import notificationRoutes from "./src/routes/notifications.js";
import bccRoutes from "./src/routes/bcc.js";
import outlookRoutes from "./src/routes/outlook.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

// ─────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────
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
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────
// Body Parser
// ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ─────────────────────────────────────────────────────────
// Health Route
// ─────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "API Running Successfully 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────
app.use("/api/clients", clientRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api", timelineRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bcc", bccRoutes);
app.use("/api/outlook", outlookRoutes);

// ─────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "not_found",
    message: "Route not found",
  });
});

// ─────────────────────────────────────────────────────────
// Error Middleware
// ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────
// MongoDB Connection (Serverless Optimized)
// ─────────────────────────────────────────────────────────
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log("MongoDB connected");
  return cached.conn;
}

// ─────────────────────────────────────────────────────────
// Vercel Serverless Handler
// ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

// ─────────────────────────────────────────────────────────
// Local Development Server
// ─────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running → http://localhost:${PORT}`);
        console.log(`Health check → http://localhost:${PORT}/api/health`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err);
      process.exit(1);
    });
}