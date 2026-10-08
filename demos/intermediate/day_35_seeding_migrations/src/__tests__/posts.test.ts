import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    post: { findMany: jest.fn(), findFirstOrThrow: jest.fn() },
    author: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

const expectToMatchSpec = createContractMatcher(openApiDocument);
const now = new Date();
const post = {
  id: 'p1',
  slug: 'rest-resource-naming-1',
  title: 'REST resource naming',
  body: 'Notes',
  published: true,
  publishedAt: now,
  authorId: 'a1',
  author: { name: 'Ada Lovelace', email: 'ada@example.com' },
  createdAt: now,
};

beforeEach(() => jest.clearAllMocks());

it('lists only published posts, newest first', async () => {
  jest.mocked(prisma.post.findMany).mockResolvedValue([post] as never);

  const res = await request(app).get('/api/posts');

  expect(prisma.post.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { published: true }, orderBy: { publishedAt: 'desc' } }),
  );
  expectToMatchSpec(res, 'get', '/api/posts');
});

it('gets a published post by slug; drafts and unknown slugs are 404', async () => {
  jest.mocked(prisma.post.findFirstOrThrow).mockResolvedValueOnce(post as never);
  const found = await request(app).get('/api/posts/rest-resource-naming-1');
  expectToMatchSpec(found, 'get', '/api/posts/{slug}');
  expect(prisma.post.findFirstOrThrow).toHaveBeenCalledWith(
    expect.objectContaining({ where: { slug: 'rest-resource-naming-1', published: true } }),
  );

  jest
    .mocked(prisma.post.findFirstOrThrow)
    .mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('none', { code: 'P2025', clientVersion: '5' }));
  expect((await request(app).get('/api/posts/a-draft')).status).toBe(404);
  expect((await request(app).get('/api/posts/Not_A_Slug')).status).toBe(400);
});

it('lists authors with their published post count', async () => {
  jest
    .mocked(prisma.author.findMany)
    .mockResolvedValue([
      { id: 'a1', email: 'ada@example.com', name: 'Ada Lovelace', createdAt: now, _count: { posts: 4 } },
    ] as never);

  expectToMatchSpec(await request(app).get('/api/authors'), 'get', '/api/authors');
});

it('serves health and docs', async () => {
  expect((await request(app).get('/health')).status).toBe(200);
  expect((await request(app).get('/api/docs/openapi.json')).body.paths['/api/authors']).toBeDefined();
});
