import { logger, startServer } from '@restful/shared';
import app from './app';
import { config } from './config';
import prisma from './lib/prisma';
import { ensureBucket, s3 } from './lib/storage';

const start = async () => {
  if (config.s3.createBucket) await ensureBucket();
  startServer(app, {
    port: config.port,
    name: 'Day 39',
    onShutdown: [() => prisma.$disconnect(), async () => s3.destroy()],
  });
};

start().catch((error: unknown) => {
  logger.error('Startup failed', { error });
  process.exit(1);
});
