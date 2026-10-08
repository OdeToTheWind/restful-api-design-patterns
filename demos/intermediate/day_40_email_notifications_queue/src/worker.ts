import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { logger, runWithLogContext } from '@restful/shared';
import { config } from './config';
import { EMAIL_QUEUE, createRedisConnection } from './queue/email.queue';
import { createEmailProcessor } from './queue/email.processor';

/**
 * The worker is its own process (`pnpm worker`): the API only enqueues, so a slow or
 * broken mail server never slows down or fails an HTTP request. Scale workers separately.
 */
const transport = nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: false });
const process_ = createEmailProcessor(transport, config.mailFrom);

const worker = new Worker(EMAIL_QUEUE, (job) => runWithLogContext({ jobId: job.id }, () => process_(job)), {
  connection: createRedisConnection(),
  concurrency: 5,
});

worker.on('failed', (job, error) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    logger.error('DEAD LETTER: email job failed permanently after exhausting all retries', {
      jobId: job.id,
      type: job.data?.type,
      to: job.data?.to,
      attemptsMade: job.attemptsMade,
      error: error.message,
    });
  }
});
logger.info(`Email worker listening on queue "${EMAIL_QUEUE}"`);

// Finish the jobs in progress, then exit (same idea as startServer for the API)
const shutdown = async (signal: string) => {
  logger.info(`Email worker shutting down (${signal})`);
  await worker.close();
  transport.close();
  process.exit(0);
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
