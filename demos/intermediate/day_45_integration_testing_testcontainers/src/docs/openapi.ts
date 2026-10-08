import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { bookmarkIdParamsSchema, createBookmarkSchema } from '../validators/bookmark.schema';

const api = createApiRegistry();
const { registry } = api;

const Bookmark = registry.register(
  'Bookmark',
  z.object({
    id: z.string(),
    url: z.string().url(),
    title: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/bookmarks',
  tags: ['Bookmarks'],
  summary: 'List bookmarks; repeat ?tag= to require several tags',
  request: { query: z.object({ tag: z.array(z.string()).optional() }) },
  responses: { 200: api.success('Bookmarks', z.array(Bookmark)), 400: api.error('Invalid tag') },
});
registry.registerPath({
  method: 'post',
  path: '/api/bookmarks',
  tags: ['Bookmarks'],
  request: { body: jsonContent(createBookmarkSchema) },
  responses: {
    201: api.success('Created', Bookmark),
    400: api.error('Validation failed'),
    409: api.error('URL already bookmarked'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/bookmarks/{id}',
  tags: ['Bookmarks'],
  request: { params: bookmarkIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 45 — Bookmarks API (Testcontainers)' });
