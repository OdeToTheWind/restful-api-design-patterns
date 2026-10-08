import { createApiRegistry, generateOpenApiDocument } from '@restful/shared';
import { z } from 'zod';

const api = createApiRegistry();
const { registry } = api;

const ProductV1 = registry.register(
  'ProductV1',
  z.object({ id: z.string(), name: z.string(), priceCents: z.number().int(), currency: z.enum(['USD', 'EUR']) }),
);
const deprecationHeaders = {
  Deprecation: {
    description: 'When v1 was deprecated (RFC 9745), e.g. @1790812800',
    schema: { type: 'string' as const },
  },
  Sunset: { description: 'When v1 stops working (RFC 8594)', schema: { type: 'string' as const } },
  Link: { description: 'rel="successor-version" points to v2', schema: { type: 'string' as const } },
};

registry.registerPath({
  method: 'get',
  path: '/api/v1/products',
  tags: ['v1 (deprecated)'],
  deprecated: true,
  summary: 'All products (no pagination)',
  responses: {
    200: { ...api.success('Products', z.array(ProductV1)), headers: deprecationHeaders },
    410: api.error('v1 has been retired'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/v1/products/{id}',
  tags: ['v1 (deprecated)'],
  deprecated: true,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { ...api.success('Product', ProductV1), headers: deprecationHeaders },
    400: api.error('Invalid id'),
    404: api.error('Not found'),
    410: api.error('v1 has been retired'),
  },
});

export const v1Document = generateOpenApiDocument(registry, {
  title: 'Day 42 — Products API v1 (deprecated)',
  description: 'Deprecated: migrate to /api/v2. See the Sunset header for the shutdown date.',
});
