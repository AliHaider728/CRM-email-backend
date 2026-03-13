require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined. Check your .env file (remove any leading spaces before MONGODB_URI).');
  process.exit(1);
}

async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    app.listen(PORT, () => {
      console.log(`\nNexusCRM API running at http://localhost:${PORT}`);
      console.log(`  Health:   GET  /api/health`);
      console.log(`  Stats:    GET  /api/stats/overview`);
      console.log(`  Clients:  GET  /api/clients`);
      console.log(`  Emails:   GET  /api/emails`);
      console.log(`  Team:     GET  /api/team\n`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err.message);
    process.exit(1);
  }
}

start();