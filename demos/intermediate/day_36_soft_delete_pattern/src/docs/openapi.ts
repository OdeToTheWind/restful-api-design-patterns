import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import {
  articleIdParamsSchema,
  articleSlugParamsSchema,
  createArticleSchema,
  updateArticleSchema,
} from '../validators/article.schema';

const api = createApiRegistry();
const { registry } = api;

const Article = registry.register(
  'Article',
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    body: z.string(),
    deletedAt: z.string().datetime().nullable().describe('null = active; otherwise when it was moved to the trash'),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/articles',
  tags: ['Articles'],
  summary: 'Active articles',
  responses: { 200: api.success('Articles', z.array(Article)) },
});
registry.registerPath({
  method: 'post',
  path: '/api/articles',
  tags: ['Articles'],
  request: { body: jsonContent(createArticleSchema) },
  responses: {
    201: api.success('Created', Article),
    400: api.error('Validation failed'),
    409: api.error('Slug used by an active article'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/articles/{slug}',
  tags: ['Articles'],
  request: { params: articleSlugParamsSchema },
  responses: {
    200: api.success('Article', Article),
    400: api.error('Invalid slug'),
    404: api.error('Not found (or in the trash)'),
  },
});
registry.registerPath({
  method: 'patch',
  path: '/api/articles/{id}',
  tags: ['Articles'],
  request: { params: articleIdParamsSchema, body: jsonContent(updateArticleSchema.innerType()) },
  responses: {
    200: api.success('Updated', Article),
    400: api.error('Validation failed'),
    404: api.error('Not found (or in the trash)'),
    409: api.error('Slug taken'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/articles/{id}',
  tags: ['Articles'],
  summary: 'Move to trash (soft delete)',
  request: { params: articleIdParamsSchema },
  responses: { 200: api.success('In the trash', Article), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/articles/trash',
  tags: ['Trash'],
  summary: 'Deleted articles, most recent first',
  responses: { 200: api.success('Trash', z.array(Article)) },
});
registry.registerPath({
  method: 'post',
  path: '/api/articles/{id}/restore',
  tags: ['Trash'],
  request: { params: articleIdParamsSchema },
  responses: {
    200: api.success('Restored', Article),
    404: api.error('Not in the trash'),
    409: api.error('Its slug is now used by another article'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/articles/{id}/permanent',
  tags: ['Trash'],
  summary: 'Delete for good (only from the trash)',
  request: { params: articleIdParamsSchema },
  responses: { 200: api.success('Purged', z.null()), 404: api.error('Not in the trash') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 36 — Soft delete' });
