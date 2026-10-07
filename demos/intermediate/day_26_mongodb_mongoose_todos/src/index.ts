import mongoose from 'mongoose';
import { logger, startServer } from '@restful/shared';
import app from './app';
import { config } from './config';

// Connect first, then accept traffic — no requests hit a disconnected DB
mongoose
  .connect(config.mongoUri)
  .then(() => {
    logger.info('✅ MongoDB Connected');
    // SIGTERM/SIGINT: stop accepting requests, finish in-flight ones, then disconnect
    startServer(app, { port: config.port, name: 'Day 26', onShutdown: [() => mongoose.disconnect()] });
  })
  .catch((error: unknown) => {
    logger.error('❌ MongoDB Connection Error', { error });
    process.exit(1);
  });
