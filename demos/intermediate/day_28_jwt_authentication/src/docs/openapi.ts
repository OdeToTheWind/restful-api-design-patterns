import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validators/auth.schema';

const api = createApiRegistry();
const { registry } = api;

const User = registry.register(
  'User',
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);
const TokenPair = registry.register(
  'TokenPair',
  z.object({ token: z.string(), refreshToken: z.string(), expiresIn: z.number().int() }),
);
const tooMany = api.error('Rate limited (per IP, or per account for failed logins)');

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  request: { body: jsonContent(registerSchema) },
  responses: {
    201: api.success('Registered', User),
    400: api.error('Validation failed'),
    409: api.error('Email taken'),
    429: tooMany,
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  request: { body: jsonContent(loginSchema) },
  responses: {
    200: api.success('Logged in', TokenPair.extend({ user: User })),
    400: api.error('Validation failed'),
    401: api.error('Invalid credentials'),
    429: tooMany,
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  request: { body: jsonContent(refreshTokenSchema) },
  responses: {
    200: api.success('New token pair', TokenPair),
    400: api.error('Validation failed'),
    401: api.error('Invalid, expired or reused refresh token'),
    429: tooMany,
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  request: { body: jsonContent(refreshTokenSchema) },
  responses: { 200: api.success('Logged out', z.null()), 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  security: api.bearerSecurity,
  responses: {
    200: api.success('Current user', z.object({ id: z.string(), email: z.string(), role: z.string() })),
    401: api.error('Not authenticated'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 28 — JWT authentication' });
