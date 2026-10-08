import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { emailRequestSchema, jobIdParamsSchema } from '../emails/schema';

const api = createApiRegistry();
const { registry } = api;

const Accepted = z.object({ jobId: z.string(), duplicate: z.boolean(), statusUrl: z.string() });

registry.registerPath({
  method: 'post',
  path: '/api/emails',
  tags: ['Emails'],
  summary: 'Queue an email for delivery (202 Accepted)',
  request: {
    headers: z.object({
      'Idempotency-Key': z.string().optional().describe('Same key → same job; the email is sent once'),
    }),
    body: jsonContent(emailRequestSchema),
  },
  responses: {
    202: {
      ...api.success('Queued', Accepted),
      headers: { Location: { description: 'Status URL', schema: { type: 'string' } } },
    },
    200: api.success('Already accepted with this Idempotency-Key', Accepted),
    400: api.error('Validation failed'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/emails/{jobId}',
  tags: ['Emails'],
  summary: 'Delivery status',
  request: { params: jobIdParamsSchema },
  responses: {
    200: api.success(
      'Status',
      z.object({
        jobId: z.string(),
        type: z.enum(['welcome', 'order-confirmation']),
        state: z.enum([
          'waiting',
          'delayed',
          'active',
          'completed',
          'failed',
          'prioritized',
          'waiting-children',
          'unknown',
        ]),
        attemptsMade: z.number().int(),
        failedReason: z.string().nullable(),
        finishedAt: z.string().datetime().nullable(),
      }),
    ),
    404: api.error('Unknown or expired job'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/admin/emails/failed',
  tags: ['Admin'],
  summary: 'Dead-letter visibility: list failed email jobs',
  responses: {
    200: api.success(
      'Failed jobs',
      z.object({
        count: z.number().int(),
        jobs: z.array(
          z.object({
            jobId: z.string(),
            type: z.string(),
            to: z.string(),
            attemptsMade: z.number().int(),
            failedReason: z.string().nullable(),
            failedAt: z.string().datetime().nullable(),
          }),
        ),
      }),
    ),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/admin/emails/failed/{jobId}/retry',
  tags: ['Admin'],
  summary: 'Dead-letter re-queue: retry a failed email job',
  request: { params: jobIdParamsSchema },
  responses: {
    200: api.success('Retried', z.object({ jobId: z.string(), retried: z.boolean(), statusUrl: z.string() })),
    404: api.error('Job not found'),
    409: api.error('Job is not in failed state'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 40 — Email notifications with a queue',
});
