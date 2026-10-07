import { logger, startServer } from '@restful/shared';
import app from './app';
import { config } from './config';
import prisma from './lib/prisma';
import redis from './lib/redis';

// Redis is an optimisation: if it isn't reachable at startup, serve from the database
// (X-Cache: BYPASS) while ioredis keeps reconnecting in the background.
redis
  .connect()
  .catch((error: Error) => logger.warn('Redis unavailable at startup, caching disabled', { error: error.message }));

startServer(app, {
  port: config.port,
  name: 'Day 33',
  onShutdown: [
    () => prisma.$disconnect(),
    // QUIT needs a live connection; if Redis is already gone, just drop the socket
    async () => (redis.status === 'ready' ? redis.quit() : redis.disconnect()),
  ],
});
