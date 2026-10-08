import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { EmailRequest } from '../emails/schema';
import { config } from '../config';

export const EMAIL_QUEUE = 'emails';

/** BullMQ needs maxRetriesPerRequest: null so blocking commands aren't cut off. */
export const createRedisConnection = () => new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

export type EmailQueue = Pick<Queue<EmailRequest>, 'add' | 'getJob' | 'getFailed'>;

/**
 * Jobs survive restarts (they're in Redis), are retried with exponential backoff
 * (1s, 2s, 4s, …) and are cleaned up after a while so Redis doesn't grow forever.
 */
export const createEmailQueue = (connection: IORedis) =>
  new Queue<EmailRequest>(EMAIL_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: config.maxAttempts,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 60 * 60, count: 1000 },
      removeOnFail: { age: 24 * 60 * 60 },
    },
  });
