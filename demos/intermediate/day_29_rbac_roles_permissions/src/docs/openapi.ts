import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z, ZodTypeAny } from 'zod';
import { Role } from '../../generated/prisma';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validators/auth.schema';

// Adds `.openapi()` to every Zod schema (prototype patch, so existing schemas get it too)
extendZodWithOpenApi(z);

/**
 * The spec is generated from the same Zod schemas that validate requests,
 * so the documentation can't drift from what the API actually accepts.
 */
const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const ErrorResponse = registry.register(
  'ErrorResponse',
  z.object({
    success: z.literal(false),
    message: z.string(),
    errors: z
      .record(z.array(z.string()))
      .nullable()
      .openapi({ description: 'Field errors for 400 validation failures' }),
    timestamp: z.string().datetime(),
  }),
);

const success = <T extends ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), message: z.string(), data, timestamp: z.string().datetime() });

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

const json = <T extends ZodTypeAny>(schema: T) => ({ content: { 'application/json': { schema } } });
const errorResponse = (description: string) => ({ description, ...json(ErrorResponse) });
const tooManyRequests = errorResponse('Rate limit exceeded (AUTH_RATE_LIMIT per 15 minutes per IP)');

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user (always created with role USER)',
  request: { body: json(registerSchema) },
  responses: {
    201: { description: 'User created', ...json(success(User)) },
    400: errorResponse('Validation failed'),
    409: errorResponse('Email already registered'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Log in and receive an access + refresh token pair',
  request: { body: json(loginSchema) },
  responses: {
    200: { description: 'Logged in', ...json(success(TokenPair.extend({ user: User }))) },
    400: errorResponse('Validation failed'),
    401: errorResponse('Invalid credentials'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  summary: 'Exchange a refresh token for a new pair (the old refresh token is revoked)',
  description: 'Reusing an already-rotated refresh token revokes every session of that user.',
  request: { body: json(refreshTokenSchema) },
  responses: {
    200: { description: 'New token pair', ...json(success(TokenPair)) },
    400: errorResponse('Validation failed'),
    401: errorResponse('Invalid, expired or reused refresh token'),
    429: tooManyRequests,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Revoke a refresh token (idempotent)',
  request: { body: json(refreshTokenSchema) },
  responses: {
    200: { description: 'Logged out', ...json(success(z.null())) },
    400: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'The user encoded in the access token',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: 'Current user', ...json(success(User.pick({ id: true, email: true, role: true }))) },
    401: errorResponse('Missing, invalid or expired access token'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  summary: 'List users (ADMIN or MODERATOR)',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: 'All users', ...json(success(z.array(User.omit({ updatedAt: true })))) },
    401: errorResponse('Not authenticated'),
    403: errorResponse('Role not allowed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users/admin',
  tags: ['Users'],
  summary: 'Admin dashboard stats (ADMIN only)',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'Dashboard',
      ...json(success(z.object({ message: z.string(), stats: z.object({ totalUsers: z.number().int() }) }))),
    },
    401: errorResponse('Not authenticated'),
    403: errorResponse('Role not allowed'),
  },
});

export const openApiDocument = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Day 29 — RBAC API',
    version: '1.0.0',
    description: 'JWT authentication with refresh-token rotation and role-based access control.',
  },
});
