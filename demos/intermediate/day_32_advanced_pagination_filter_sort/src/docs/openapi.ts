import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createProductSchema, listProductsQuery, productFeedQuery } from '../validators/product.schema';

const api = createApiRegistry();
const { registry } = api;

const Product = registry.register(
  'Product',
  z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    priceCents: z.number().int(),
    stock: z.number().int(),
    createdAt: z.string().datetime(),
  }),
);

const OffsetMeta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

const CursorMeta = z.object({
  limit: z.number().int(),
  nextCursor: z
    .string()
    .nullable()
    .openapi({ description: 'Pass as ?cursor= to get the next page; null on the last page' }),
  hasNextPage: z.boolean(),
});

registry.registerPath({
  method: 'get',
  path: '/api/products',
  tags: ['Products'],
  summary: 'Search products — offset pagination, filters and sorting',
  description: 'sort: name | price | createdAt, prefix with "-" for descending (default -createdAt).',
  // The refine() wrapper isn't a plain object, so document the underlying query fields
  request: { query: listProductsQuery.innerType() },
  responses: {
    200: api.success('A page of products', z.object({ items: z.array(Product), meta: OffsetMeta })),
    400: api.error('Invalid query (unknown sort, bad price range, pageSize > 100…)'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/feed',
  tags: ['Products'],
  summary: 'Newest products — cursor (keyset) pagination',
  request: { query: productFeedQuery },
  responses: {
    200: api.success('A page of products', z.object({ items: z.array(Product), meta: CursorMeta })),
    400: api.error('Invalid query or cursor'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/products',
  tags: ['Products'],
  summary: 'Add a product',
  request: { body: jsonContent(createProductSchema) },
  responses: { 201: api.success('Created', Product), 400: api.error('Validation failed') },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 32 — Products API (pagination, filtering, sorting)',
});
