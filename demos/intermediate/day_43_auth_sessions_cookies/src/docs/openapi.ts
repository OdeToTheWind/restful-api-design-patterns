import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { loginSchema, registerSchema, sessionIdParamsSchema } from '../validators/auth.schema';

const api = createApiRegistry();
const { registry } = api;

const csrfCookieAuth = registry.registerComponent('securitySchemes', 'refreshCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: 'refresh_token',
  description: 'httpOnly session cookie set by /login. These endpoints also require the X-CSRF-Token header.',
});
const csrfHeader = z.string().openapi({ description: 'Must equal the csrf_token cookie (double-submit)' });

const User = z.object({ id: z.string(), name: z.string(), email: z.string().email() });
const AccessToken = z.object({ token: z.string(), expiresIn: z.number().int().openapi({ example: 900 }) });
const Session = registry.register(
  'Session',
  z.object({
    id: z.string().uuid(),
    userAgent: z.string().nullable(),
    ip: z.string().nullable(),
    startedAt: z.string().datetime(),
    lastUsedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    current: z.boolean().openapi({ description: 'The session this access token belongs to' }),
  }),
);
const setCookies = {
  'Set-Cookie': {
    description: 'refresh_token (httpOnly, SameSite=Strict, Path=/api/auth) and csrf_token',
    schema: { type: 'string' as const },
  },
};

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  request: { body: jsonContent(registerSchema) },
  responses: {
    201: api.success('Registered', User.extend({ createdAt: z.string().datetime() })),
    400: api.error('Validation failed'),
    409: api.error('Email already registered'),
    429: api.error('Rate limited'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Start a session: access token in the body, refresh token in an httpOnly cookie',
  request: { body: jsonContent(loginSchema) },
  responses: {
    200: { ...api.success('Logged in', AccessToken.extend({ user: User })), headers: setCookies },
    400: api.error('Validation failed'),
    401: api.error('Invalid credentials'),
    429: api.error('Rate limited'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  summary: 'Rotate the session cookie and get a new access token',
  security: [{ [csrfCookieAuth.name]: [] }],
  request: { headers: z.object({ 'X-CSRF-Token': csrfHeader }) },
  responses: {
    200: { ...api.success('New access token', AccessToken), headers: setCookies },
    401: api.error('No session, expired, or reused token (all sessions revoked)'),
    403: api.error('Missing or invalid CSRF token'),
    429: api.error('Rate limited'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'End this session and clear the cookies',
  security: [{ [csrfCookieAuth.name]: [] }],
  request: { headers: z.object({ 'X-CSRF-Token': csrfHeader }) },
  responses: { 200: api.success('Logged out', z.null()), 403: api.error('Missing or invalid CSRF token') },
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
registry.registerPath({
  method: 'get',
  path: '/api/auth/sessions',
  tags: ['Sessions'],
  summary: 'Your active sessions (devices)',
  security: api.bearerSecurity,
  responses: { 200: api.success('Sessions', z.array(Session)), 401: api.error('Not authenticated') },
});
registry.registerPath({
  method: 'delete',
  path: '/api/auth/sessions',
  tags: ['Sessions'],
  summary: 'Sign out everywhere except this session',
  security: api.bearerSecurity,
  responses: {
    200: api.success('Revoked', z.object({ revoked: z.number().int() })),
    401: api.error('Not authenticated'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/auth/sessions/{id}',
  tags: ['Sessions'],
  summary: 'Sign out one of your sessions',
  security: api.bearerSecurity,
  request: { params: sessionIdParamsSchema },
  responses: {
    200: api.success('Revoked', z.null()),
    400: api.error('Invalid id'),
    401: api.error('Not authenticated'),
    404: api.error('No such active session of yours'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 43 — Cookie-based sessions' });
