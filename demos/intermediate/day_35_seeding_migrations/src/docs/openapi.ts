import { createApiRegistry, generateOpenApiDocument } from '@restful/shared';
import { z } from 'zod';
import { postSlugParamsSchema } from '../validators/post.schema';

const api = createApiRegistry();
const { registry } = api;

const AuthorRef = z.object({ name: z.string(), email: z.string().email() });
const Post = registry.register(
  'Post',
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    body: z.string(),
    published: z.boolean(),
    publishedAt: z.string().datetime().nullable(),
    authorId: z.string(),
    author: AuthorRef,
    createdAt: z.string().datetime(),
  }),
);
const Author = registry.register(
  'Author',
  z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
    _count: z.object({ posts: z.number().int().openapi({ description: 'Published posts' }) }),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/posts',
  tags: ['Blog'],
  summary: 'Published posts, newest first',
  responses: { 200: api.success('Posts', z.array(Post)) },
});
registry.registerPath({
  method: 'get',
  path: '/api/posts/{slug}',
  tags: ['Blog'],
  summary: 'One published post',
  request: { params: postSlugParamsSchema },
  responses: { 200: api.success('The post', Post), 400: api.error('Invalid slug'), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'get',
  path: '/api/authors',
  tags: ['Blog'],
  summary: 'Authors with their published post count',
  responses: { 200: api.success('Authors', z.array(Author)) },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 35 — Blog API (seeded data)' });
