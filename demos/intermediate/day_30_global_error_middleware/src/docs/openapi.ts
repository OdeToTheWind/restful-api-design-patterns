import { createApiRegistry, generateOpenApiDocument } from '@restful/shared';
import { z } from 'zod';

// Each endpoint demonstrates one path through the global error handler
const api = createApiRegistry();
const { registry } = api;

registry.registerPath({
  method: 'get',
  path: '/api/test/success',
  tags: ['Error handling'],
  responses: { 200: api.success('OK', z.object({ message: z.string() })) },
});
registry.registerPath({
  method: 'get',
  path: '/api/test/bad-request',
  tags: ['Error handling'],
  summary: 'An AppError(400) thrown by a controller',
  responses: { 400: api.error('Invalid input data') },
});
registry.registerPath({
  method: 'get',
  path: '/api/test/not-found',
  tags: ['Error handling'],
  summary: 'An AppError(404) thrown by a controller',
  responses: { 404: api.error('Resource not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/test/server-error',
  tags: ['Error handling'],
  summary: 'An unexpected Error — logged, and answered with a generic 500',
  responses: { 500: api.error('Internal Server Error (details never leak)') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 30 — Global error middleware' });
