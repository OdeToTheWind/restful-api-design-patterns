import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

// Unit level: validation and query building only. Database behaviour is covered by
// src/__integration__ against a real PostgreSQL.
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    bookmark: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), delete: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

it('normalises and de-duplicates tags before storing', async () => {
  jest.mocked(prisma.bookmark.create).mockResolvedValue({} as never);

  await request(app)
    .post('/api/bookmarks')
    .send({ url: 'https://example.com', title: 'Example', tags: ['API', 'api', 'rest'] });

  expect(jest.mocked(prisma.bookmark.create).mock.calls[0][0].data.tags).toEqual(['api', 'rest']);
});

it('turns one or many ?tag= params into a hasEvery filter', async () => {
  await request(app).get('/api/bookmarks?tag=Rest');
  await request(app).get('/api/bookmarks?tag=rest&tag=api');
  await request(app).get('/api/bookmarks');

  const wheres = jest.mocked(prisma.bookmark.findMany).mock.calls.map(([args]) => args?.where);
  expect(wheres).toEqual([{ tags: { hasEvery: ['rest'] } }, { tags: { hasEvery: ['rest', 'api'] } }, {}]);
});

it.each([
  [{ url: 'not a url', title: 'x' }, 'url'],
  [{ url: 'https://a.co', title: '' }, 'title'],
  [{ url: 'https://a.co', title: 'x', tags: ['has space'] }, 'tags'],
])('rejects %p with 400', async (body, field) => {
  const res = await request(app).post('/api/bookmarks').send(body);
  expect(res.status).toBe(400);
  expect(Object.keys(res.body.errors)).toContain(field);
});

it('rejects bad tag filters and ids; serves health and docs', async () => {
  expect((await request(app).get('/api/bookmarks?tag=a%20b')).status).toBe(400);
  expect((await request(app).delete('/api/bookmarks/nope')).status).toBe(400);
  expect((await request(app).get('/health')).status).toBe(200);
  expect((await request(app).get('/api/docs/openapi.json')).body.paths['/api/bookmarks']).toBeDefined();
});

it('creates and deletes, and reports readiness from the database check', async () => {
  jest.mocked(prisma.bookmark.create).mockResolvedValue({} as never);
  jest.mocked(prisma.bookmark.delete).mockResolvedValue({} as never);
  jest.mocked(prisma.$queryRaw).mockResolvedValue([] as never);

  expect((await request(app).post('/api/bookmarks').send({ url: 'https://a.co', title: 'A' })).status).toBe(201);
  expect((await request(app).delete('/api/bookmarks/clx0000000000000000000001')).status).toBe(200);
  expect((await request(app).get('/ready')).status).toBe(200);
});
