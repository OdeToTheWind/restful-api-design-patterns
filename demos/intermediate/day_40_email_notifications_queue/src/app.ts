import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  ApiResponse,
  AppError,
  asyncHandler,
  docsRouter,
  errorHandler,
  HealthCheck,
  healthRouter,
  notFoundHandler,
  requestId,
  requestLogger,
  validateBody,
  validateParams,
} from '@restful/shared';
import { config } from './config';
import { openApiDocument } from './docs/openapi';
import { EmailRequest, emailRequestSchema, idempotencyKeySchema, jobIdParamsSchema } from './emails/schema';
import type { EmailQueue } from './queue/email.queue';

export interface AppDependencies {
  queue: EmailQueue;
  readinessChecks?: Record<string, HealthCheck>;
}

export const createApp = ({ queue, readinessChecks = {} }: AppDependencies): Application => {
  const app = express();
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(healthRouter(readinessChecks));
  app.use(docsRouter(openApiDocument));

  /**
   * Accepts the email for delivery and returns immediately: 202 Accepted, not 201 Created,
   * because the work happens later in the worker. The client can poll statusUrl.
   */
  app.post(
    '/api/emails',
    validateBody(emailRequestSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const key = req.get('Idempotency-Key');
      if (key !== undefined && !idempotencyKeySchema.safeParse(key).success) {
        throw new AppError('Validation failed', 400, {
          'Idempotency-Key': ['8–100 characters: letters, digits, _ or -'],
        });
      }
      // Same key → same job id: a retried request never sends the email twice
      const jobId = key ? `email-${key}` : undefined;
      if (jobId && (await queue.getJob(jobId))) {
        return ApiResponse.success(
          res,
          { jobId, duplicate: true, statusUrl: `/api/emails/${jobId}` },
          'Already accepted',
          200,
        );
      }

      const email = req.body as EmailRequest;
      const job = await queue.add(email.type, email, { jobId });
      res.setHeader('Location', `/api/emails/${job.id}`);
      ApiResponse.success(
        res,
        { jobId: job.id!, duplicate: false, statusUrl: `/api/emails/${job.id}` },
        'Email queued',
        202,
      );
    }),
  );

  app.get(
    '/api/emails/:jobId',
    validateParams(jobIdParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const job = await queue.getJob(req.params.jobId);
      if (!job) throw new AppError('Email job not found (it may have expired)', 404);
      ApiResponse.success(res, {
        jobId: job.id!,
        type: job.data.type,
        state: await job.getState(),
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason ?? null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      });
    }),
  );

  /**
   * Dead-letter visibility: list jobs that failed permanently after exhausting all retries.
   */
  app.get(
    '/api/admin/emails/failed',
    asyncHandler(async (_req: Request, res: Response) => {
      const failedJobs = await queue.getFailed(0, 100);
      const jobs = await Promise.all(
        failedJobs.map(async (j) => ({
          jobId: j.id!,
          type: j.data.type,
          to: j.data.to,
          attemptsMade: j.attemptsMade,
          failedReason: j.failedReason ?? null,
          failedAt: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
        })),
      );
      ApiResponse.success(res, { count: jobs.length, jobs }, 'Failed email jobs fetched');
    }),
  );

  /**
   * Dead-letter re-queue: retry a failed job.
   */
  app.post(
    '/api/admin/emails/failed/:jobId/retry',
    validateParams(jobIdParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const job = await queue.getJob(req.params.jobId);
      if (!job) throw new AppError('Email job not found', 404);
      const state = await job.getState();
      if (state !== 'failed') {
        throw new AppError(`Only failed jobs can be retried (current state: ${state})`, 409);
      }
      await job.retry();
      ApiResponse.success(
        res,
        { jobId: job.id!, retried: true, statusUrl: `/api/emails/${job.id}` },
        'Job re-queued for delivery',
        200,
      );
    }),
  );

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 40 - Email Notifications with a Queue', documentation: '/api/docs', day: 40 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
