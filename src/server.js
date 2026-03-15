import dotenv from 'dotenv' ;
dotenv.config();
import mongoose from 'mongoose';
import app from './app.js';

const PORT        = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    app.listen(PORT, () => {
      console.log(`\nNexusCRM API  →  http://localhost:${PORT}`);
      console.log('  GET  /api/health');
      console.log('  GET  /api/stats/overview');
      console.log('  GET  /api/clients');
      console.log('  GET  /api/emails');
      console.log('  GET  /api/team\n');
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();