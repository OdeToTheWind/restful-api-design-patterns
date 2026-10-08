import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { Role } from '../../generated/prisma';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validators/auth.schema';

/**
 * The spec is generated from the same Zod schemas that validate requests,
 * so the documentation can't drift from what the API actually accepts.
 */
const api = createApiRegistry();
const { registry } = api;

const User = registry.register(
  'User',
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(Role),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const TokenPair = registry.register(
  'TokenPair',
  z.object({
    token: z.string().openapi({ description: 'Access token (JWT) for the Authorization header' }),
    refreshToken: z.string().openapi({ description: 'Single-use; exchange at /api/auth/refresh' }),
    expiresIn: z.number().int().openapi({ example: 900, description: 'Access token lifetime in seconds' }),
  }),
);

const tooManyRequests = api.error('Rate limit exceeded (per IP, or per account for failed logins)');

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user (always created with role USER)',
  request: { body: jsonContent(registerSchema) },
  responses: {
    201: api.success('User created', User),
    400: api.error('Validation failed'),
    409: api.error('Email already registered'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Log in and receive an access + refresh token pair',
  request: { body: jsonContent(loginSchema) },
  responses: {
    200: api.success('Logged in', TokenPair.extend({ user: User })),
    400: api.error('Validation failed'),
    401: api.error('Invalid credentials'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  summary: 'Exchange a refresh token for a new pair (the old refresh token is revoked)',
  description: 'Reusing an already-rotated refresh token revokes every session of that user.',
  request: { body: jsonContent(refreshTokenSchema) },
  responses: {
    200: api.success('New token pair', TokenPair),
    400: api.error('Validation failed'),
    401: api.error('Invalid, expired or reused refresh token'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Revoke a refresh token (idempotent)',
  request: { body: jsonContent(refreshTokenSchema) },
  responses: {
    200: api.success('Logged out', z.null()),
    400: api.error('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'The user encoded in the access token',
  security: api.bearerSecurity,
  responses: {
    200: api.success('Current user', User.pick({ id: true, email: true, role: true })),
    401: api.error('Missing, invalid or expired access token'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  summary: 'List users (ADMIN or MODERATOR)',
  security: api.bearerSecurity,
  responses: {
    200: api.success('All users', z.array(User.omit({ updatedAt: true }))),
    401: api.error('Not authenticated'),
    403: api.error('Role not allowed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users/admin',
  tags: ['Users'],
  summary: 'Admin dashboard stats (ADMIN only)',
  security: api.bearerSecurity,
  responses: {
    200: api.success('Dashboard', z.object({ message: z.string(), stats: z.object({ totalUsers: z.number().int() }) })),
    401: api.error('Not authenticated'),
    403: api.error('Role not allowed'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 29 — RBAC API',
  description: 'JWT authentication with refresh-token rotation and role-based access control.',
});
