import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import {
  adminUserDto,
  loginDto,
  privateUserDto,
  publicUserDto,
  registerDto,
  updateNotesDto,
  updateProfileDto,
  userIdParamsDto,
} from '../dtos/user.dto';

// The response DTO schemas double as the documented response shapes
const api = createApiRegistry();
const { registry } = api;

const PublicUser = registry.register('PublicUser', publicUserDto);
const PrivateUser = registry.register('PrivateUser', privateUserDto);
const AdminUser = registry.register('AdminUser', adminUserDto);

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  request: { body: jsonContent(registerDto) },
  responses: {
    201: api.success('Registered — your private view', PrivateUser),
    400: api.error('Validation failed'),
    409: api.error('Email already registered'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  request: { body: jsonContent(loginDto) },
  responses: {
    200: api.success('Logged in', z.object({ token: z.string(), user: PrivateUser })),
    400: api.error('Validation failed'),
    401: api.error('Invalid credentials'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Public profile (anyone)',
  request: { params: userIdParamsDto },
  responses: { 200: api.success('Public view', PublicUser), 400: api.error('Invalid id'), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/me',
  tags: ['Users'],
  summary: 'Your own profile',
  security: api.bearerSecurity,
  responses: { 200: api.success('Private view', PrivateUser), 401: api.error('Not authenticated') },
});
registry.registerPath({
  method: 'patch',
  path: '/api/me',
  tags: ['Users'],
  summary: 'Update your display name or bio',
  security: api.bearerSecurity,
  request: { body: jsonContent(updateProfileDto.innerType()) },
  responses: {
    200: api.success('Private view', PrivateUser),
    400: api.error('Validation failed'),
    401: api.error('Not authenticated'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/admin/users',
  tags: ['Admin'],
  summary: 'All users, admin view',
  security: api.bearerSecurity,
  responses: {
    200: api.success('Admin view', z.array(AdminUser)),
    401: api.error('Not authenticated'),
    403: api.error('Not an admin'),
  },
});
registry.registerPath({
  method: 'patch',
  path: '/api/admin/users/{id}/notes',
  tags: ['Admin'],
  summary: 'Set internal notes (never visible outside the admin view)',
  security: api.bearerSecurity,
  request: { params: userIdParamsDto, body: jsonContent(updateNotesDto) },
  responses: {
    200: api.success('Admin view', AdminUser),
    400: api.error('Validation failed'),
    401: api.error('Not authenticated'),
    403: api.error('Not an admin'),
    404: api.error('Not found'),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 38 — Users API (DTOs and mappers)' });
