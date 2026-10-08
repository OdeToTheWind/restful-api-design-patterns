import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { checkoutSchema, orderIdParamsSchema } from '../checkout/schemas';

const api = createApiRegistry();
const { registry } = api;

const Order = registry.register(
  'Order',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    items: z.array(z.object({ sku: z.string(), quantity: z.number().int() })),
    subtotalCents: z.number().int(),
    discountCents: z.number().int().describe('10% happy-hour discount, 17:00–17:59 UTC'),
    totalCents: z.number().int(),
    chargeId: z.string(),
    createdAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'post',
  path: '/api/checkout',
  tags: ['Checkout'],
  summary: 'Reserve stock, charge, save the order, email a receipt (cardToken tok_declined… is refused)',
  request: { body: jsonContent(checkoutSchema) },
  responses: {
    201: api.success('Order placed', Order),
    400: api.error('Validation failed'),
    402: api.error('Payment declined'),
    409: api.error('Not enough stock'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['Checkout'],
  request: { params: orderIdParamsSchema },
  responses: { 200: api.success('Order', Order), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 44 — Checkout (test doubles)' });
