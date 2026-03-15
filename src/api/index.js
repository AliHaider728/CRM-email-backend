import dotenv from 'dotenv' ;
dotenv.config()
import mongoose from 'mongoose';
import app from '../app.js';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in Vercel environment variables.');
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB connected (serverless).');
}

// Vercel serverless handler — called on every request
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}