import { createApiRegistry, generateOpenApiDocument } from '@restful/shared';
import { z } from 'zod';

const api = createApiRegistry();
const { registry } = api;

const adminKey = registry.registerComponent('securitySchemes', 'adminKey', {
  type: 'apiKey',
  in: 'header',
  name: 'X-Admin-Key',
});

registry.registerPath({
  method: 'get',
  path: '/api/info',
  tags: ['Config'],
  summary: 'Non-secret runtime information',
  responses: {
    200: api.success(
      'Info',
      z.object({
        environment: z.enum(['development', 'test', 'production']),
        features: z.object({ newGreeting: z.boolean() }),
        rateLimitPerMinute: z.number().int(),
      }),
    ),
    429: api.error('Rate limited (RATE_LIMIT_PER_MINUTE)'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/greeting',
  tags: ['Config'],
  summary: 'Changes with the FEATURE_NEW_GREETING flag',
  responses: { 200: api.success('Greeting', z.object({ message: z.string() })), 429: api.error('Rate limited') },
});
registry.registerPath({
  method: 'get',
  path: '/api/admin/config',
  tags: ['Config'],
  summary: 'Effective configuration with secrets redacted',
  security: [{ [adminKey.name]: [] }],
  responses: {
    200: api.success('Redacted config', z.object({}).passthrough()),
    401: api.error('Invalid admin key'),
    404: api.error('Admin API disabled'),
    429: api.error('Rate limited'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 49 — Environment configs' });
