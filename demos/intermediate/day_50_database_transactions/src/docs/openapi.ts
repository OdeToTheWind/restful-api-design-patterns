import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import {
  createAccountSchema,
  idParamsSchema,
  transferSchema,
  transfersQuery,
  updateAccountSchema,
} from '../validators/schemas';

const api = createApiRegistry();
const { registry } = api;

const Account = registry.register(
  'Account',
  z.object({
    id: z.string(),
    owner: z.string(),
    balanceCents: z.number().int(),
    version: z.number().int().describe('Also returned as the ETag header'),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);
const Transfer = registry.register(
  'Transfer',
  z.object({
    id: z.string(),
    idempotencyKey: z.string().nullable(),
    fromId: z.string(),
    toId: z.string(),
    amountCents: z.number().int(),
    createdAt: z.string().datetime(),
  }),
);
const etagHeader = {
  ETag: { description: 'Current version, e.g. "3" — send it back in If-Match', schema: { type: 'string' as const } },
};

registry.registerPath({
  method: 'post',
  path: '/api/accounts',
  tags: ['Accounts'],
  request: { body: jsonContent(createAccountSchema) },
  responses: { 201: { ...api.success('Created', Account), headers: etagHeader }, 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{id}',
  tags: ['Accounts'],
  request: { params: idParamsSchema },
  responses: {
    200: { ...api.success('Account', Account), headers: etagHeader },
    304: { description: 'Not modified (If-None-Match matched)' },
    404: api.error('Not found'),
  },
});
registry.registerPath({
  method: 'patch',
  path: '/api/accounts/{id}',
  tags: ['Accounts'],
  summary: 'Update with optimistic locking (If-Match required)',
  request: {
    params: idParamsSchema,
    headers: z.object({ 'If-Match': z.string().describe('The ETag from your last read') }),
    body: jsonContent(updateAccountSchema),
  },
  responses: {
    200: { ...api.success('Updated', Account), headers: etagHeader },
    404: api.error('Not found'),
    412: api.error('Changed by someone else since your read'),
    428: api.error('If-Match is required'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/transfers',
  tags: ['Transfers'],
  summary: 'Move money atomically (Idempotency-Key recommended)',
  request: {
    headers: z.object({ 'Idempotency-Key': z.string().optional() }),
    body: jsonContent(transferSchema.innerType()),
  },
  responses: {
    201: api.success('Transferred', Transfer),
    200: api.success('Replay of an earlier transfer with the same Idempotency-Key', Transfer),
    400: api.error('Validation failed'),
    404: api.error('Account not found'),
    409: api.error('Insufficient funds'),
    422: api.error('Idempotency-Key reused for a different transfer'),
    503: {
      ...api.error('Too much contention after retries — retry later'),
      headers: { 'Retry-After': { description: 'Seconds to wait', schema: { type: 'integer' as const } } },
    },
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/transfers',
  tags: ['Transfers'],
  request: { query: transfersQuery },
  responses: { 200: api.success('Transfers', z.array(Transfer)) },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 50 — Database transactions' });
