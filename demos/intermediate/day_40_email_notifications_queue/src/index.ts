import { startServer } from '@restful/shared';
import { createApp } from './app';
import { config } from './config';
import { createEmailQueue, createRedisConnection } from './queue/email.queue';

// The API process only produces jobs; `pnpm worker` consumes them
const connection = createRedisConnection();
const queue = createEmailQueue(connection);

startServer(createApp({ queue, readinessChecks: { redis: () => connection.ping() } }), {
  port: config.port,
  name: 'Day 40',
  onShutdown: [() => queue.close(), () => connection.quit()],
});
