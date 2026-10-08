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

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 40 — Email notifications with a queue',
});
