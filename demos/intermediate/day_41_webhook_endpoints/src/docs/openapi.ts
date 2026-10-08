import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createOrderSchema, orderIdParamsSchema } from '../routes';
import { paymentEventSchema } from '../webhooks/events';

const api = createApiRegistry();
const { registry } = api;

const Order = registry.register(
  'Order',
  z.object({
    id: z.string(),
    amountCents: z.number().int(),
    status: z.enum(['PENDING', 'PAID', 'FAILED']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);
const signature = registry.registerComponent('securitySchemes', 'webhookSignature', {
  type: 'apiKey',
  in: 'header',
  name: 'Webhook-Signature',
  description: 't=<unix seconds>,v1=<hex HMAC-SHA256(secret, `${t}.${rawBody}`)>',
});

registry.registerPath({
  method: 'post',
  path: '/api/webhooks/payments',
  tags: ['Webhooks'],
  summary: 'Payment provider callback (signed, idempotent)',
  security: [{ [signature.name]: [] }],
  request: { body: jsonContent(paymentEventSchema) },
  responses: {
    200: api.success(
      'Accepted (processed, duplicate or ignored type)',
      z.object({ eventId: z.string(), status: z.enum(['processed', 'duplicate', 'ignored']) }),
    ),
    400: api.error('Malformed event'),
    401: api.error('Missing/invalid signature or stale timestamp'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/orders',
  tags: ['Orders'],
  request: { body: jsonContent(createOrderSchema) },
  responses: { 201: api.success('Created (PENDING)', Order), 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  request: { params: orderIdParamsSchema },
  responses: { 200: api.success('Order', Order), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/webhooks/events',
  tags: ['Webhooks'],
  summary: 'Recently processed events',
  responses: {
    200: api.success(
      'Events',
      z.array(
        z.object({
          id: z.string(),
          eventId: z.string(),
          type: z.string(),
          payload: z.object({}).catchall(z.unknown()),
          receivedAt: z.string().datetime(),
        }),
      ),
    ),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 41 — Webhook endpoints' });
