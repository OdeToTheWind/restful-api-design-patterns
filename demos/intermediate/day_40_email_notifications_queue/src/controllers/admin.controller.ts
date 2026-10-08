import { Request, Response } from 'express';
import { ApiResponse, AppError } from '@restful/shared';
import type { EmailQueue } from '../queue/email.queue';

export class AdminController {
  constructor(private queue: EmailQueue) {}

  listFailed = async (_req: Request, res: Response) => {
    const failedJobs = await this.queue.getFailed(0, 100);
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
  };

  retryJob = async (req: Request, res: Response) => {
    const job = await this.queue.getJob(req.params.jobId);
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
  };
}
