import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createUserSchema, updateUserSchema, userIdParamsSchema } from '../controllers/user.controller';

const api = createApiRegistry();
const { registry } = api;

const User = registry.register(
  'User',
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().nullable(),
    role: z.enum(['USER', 'ADMIN']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  responses: { 200: api.success('Users', z.array(User)) },
});
registry.registerPath({
  method: 'post',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Create a user (role is not client-settable)',
  request: { body: jsonContent(createUserSchema) },
  responses: { 201: api.success('Created', User), 400: api.error('Validation failed'), 409: api.error('Email taken') },
});
registry.registerPath({
  method: 'put',
  path: '/api/users/{id}',
  tags: ['Users'],
  request: { params: userIdParamsSchema, body: jsonContent(updateUserSchema) },
  responses: {
    200: api.success('Updated', User),
    400: api.error('Validation failed'),
    404: api.error('Not found'),
    409: api.error('Email taken'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}',
  tags: ['Users'],
  request: { params: userIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 27 — Users API (PostgreSQL + Prisma)' });
