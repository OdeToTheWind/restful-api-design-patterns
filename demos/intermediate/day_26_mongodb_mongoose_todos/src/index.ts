import mongoose from 'mongoose';
import app from './app';
import { config } from './config';

const PORT = config.port;

// Connect first, then accept traffic — no requests hit a disconnected DB
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`🚀 Day 26 Server running on http://localhost:${PORT}`);
      console.log(`📦 MongoDB Mode Activated`);
    });
  })
  .catch((err: unknown) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
