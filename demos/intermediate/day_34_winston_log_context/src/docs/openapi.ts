import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { debugLogsQuery, orderIdParamsSchema, placeOrderSchema } from '../validators';

const api = createApiRegistry();
const { registry } = api;

const Order = registry.register(
  'Order',
  z.object({
    id: z.string().uuid(),
    userId: z.string(),
    items: z.array(z.object({ sku: z.string(), quantity: z.number().int() })),
    totalCents: z.number().int(),
    status: z.literal('PAID'),
    createdAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'post',
  path: '/api/orders',
  tags: ['Orders'],
  summary: 'Place an order (use cardToken tok_declined… to see a declined payment)',
  security: api.bearerSecurity,
  request: { body: jsonContent(placeOrderSchema) },
  responses: {
    201: api.success('Order placed', Order),
    400: api.error('Validation failed'),
    401: api.error('Not authenticated'),
    402: api.error('Payment declined'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  security: api.bearerSecurity,
  request: { params: orderIdParamsSchema },
  responses: { 200: api.success('Order', Order), 401: api.error('Not authenticated'), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/debug/logs',
  tags: ['Debug'],
  summary: 'Recent log entries as written (development only)',
  request: { query: debugLogsQuery },
  responses: {
    200: api.success(
      'Log entries', // catchall (not passthrough): it's what makes the generator emit additionalProperties
      z.array(z.object({ level: z.string(), message: z.string() }).catchall(z.unknown())),
    ),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 34 — Log context' });
