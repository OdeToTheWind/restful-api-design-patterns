import { createApiRegistry, generateOpenApiDocument } from '@restful/shared';
import { z } from 'zod';

const api = createApiRegistry();
const { registry } = api;

const ProductV2 = registry.register(
  'ProductV2',
  z.object({
    id: z.string(),
    name: z.string(),
    price: z.object({ amount: z.string().describe('Decimal string, e.g. "39.99"'), currency: z.enum(['USD', 'EUR']) }),
    tags: z.array(z.string()),
  }),
);
const Meta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

registry.registerPath({
  method: 'get',
  path: '/api/v2/products',
  tags: ['v2'],
  request: {
    query: z.object({
      page: z.number().int().optional(),
      pageSize: z.number().int().optional(),
      tag: z.string().optional(),
    }),
  },
  responses: {
    200: api.success('A page of products', z.object({ items: z.array(ProductV2), meta: Meta })),
    400: api.error('Invalid query'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/v2/products/{id}',
  tags: ['v2'],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: api.success('Product', ProductV2), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const v2Document = generateOpenApiDocument(registry, { title: 'Day 42 — Products API v2' });
