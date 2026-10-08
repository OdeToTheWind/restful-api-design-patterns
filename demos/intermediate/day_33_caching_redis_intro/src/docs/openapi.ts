import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createProductSchema, productIdParamsSchema, updateProductSchema } from '../validators/product.schema';

const api = createApiRegistry();
const { registry } = api;

const Product = registry.register(
  'Product',
  z.object({
    id: z.string(),
    name: z.string(),
    priceCents: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const cacheHeader = {
  'X-Cache': {
    description: 'HIT (from Redis), MISS (loaded from the database and cached) or BYPASS (Redis unavailable)',
    schema: { type: 'string' as const, enum: ['HIT', 'MISS', 'BYPASS'] },
  },
};

registry.registerPath({
  method: 'get',
  path: '/api/products',
  tags: ['Products'],
  summary: 'List products (cached; any write invalidates every cached list)',
  responses: { 200: { ...api.success('Products', z.array(Product)), headers: cacheHeader } },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/{id}',
  tags: ['Products'],
  summary: 'Get one product (cached per id)',
  request: { params: productIdParamsSchema },
  responses: {
    200: { ...api.success('The product', Product), headers: cacheHeader },
    400: api.error('Invalid id'),
    404: api.error('Not found'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/products',
  tags: ['Products'],
  summary: 'Create a product',
  request: { body: jsonContent(createProductSchema) },
  responses: { 201: api.success('Created', Product), 400: api.error('Validation failed') },
});

registry.registerPath({
  method: 'patch',
  path: '/api/products/{id}',
  tags: ['Products'],
  summary: 'Update a product (invalidates its cache entry and all cached lists)',
  request: { params: productIdParamsSchema, body: jsonContent(updateProductSchema) },
  responses: { 200: api.success('Updated', Product), 400: api.error('Validation failed'), 404: api.error('Not found') },
});

registry.registerPath({
  method: 'delete',
  path: '/api/products/{id}',
  tags: ['Products'],
  summary: 'Delete a product (invalidates its cache entry and all cached lists)',
  request: { params: productIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 33 — Products API with Redis caching' });
