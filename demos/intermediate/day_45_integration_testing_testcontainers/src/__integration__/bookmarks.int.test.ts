import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';

/**
 * Runs the real app against a real PostgreSQL started by Testcontainers, with the real
 * migrations applied. Nothing is mocked: these tests prove what unit tests can only assume.
 */
const expectToMatchSpec = createContractMatcher(openApiDocument);
const create = (url: string, tags: string[] = []) =>
  request(app).post('/api/bookmarks').send({ url, title: url, tags });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE bookmarks`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

it('round-trips a bookmark through the database', async () => {
  const created = await create('https://prisma.io', ['orm', 'TypeScript', 'orm']);
  expect(created.status).toBe(201);
  expectToMatchSpec(created, 'post', '/api/bookmarks');

  const listed = await request(app).get('/api/bookmarks');
  expect(listed.body.data).toHaveLength(1);
  expect(listed.body.data[0].tags).toEqual(['orm', 'typescript']);
  expectToMatchSpec(listed, 'get', '/api/bookmarks');
});

it('the unique constraint (not application code) turns a duplicate URL into 409', async () => {
  await create('https://example.com');
  const duplicate = await create('https://example.com');

  expect(duplicate.status).toBe(409);
  expectToMatchSpec(duplicate, 'post', '/api/bookmarks');
  expect(await prisma.bookmark.count()).toBe(1);
});

it('filters with real Postgres array semantics (all requested tags must be present)', async () => {
  await create('https://a.dev', ['rest', 'api']);
  await create('https://b.dev', ['rest']);
  await create('https://c.dev', ['api', 'graphql']);

  const both = await request(app).get('/api/bookmarks?tag=rest&tag=api');
  const rest = await request(app).get('/api/bookmarks?tag=rest');

  expect(both.body.data.map((b: { url: string }) => b.url)).toEqual(['https://a.dev']);
  expect(rest.body.data.map((b: { url: string }) => b.url).sort()).toEqual(['https://a.dev', 'https://b.dev']);
});

it('deleting twice gives 404 from a real "record not found" (P2025)', async () => {
  const { body } = await create('https://delete.me');

  expect((await request(app).delete(`/api/bookmarks/${body.data.id}`)).status).toBe(200);
  const again = await request(app).delete(`/api/bookmarks/${body.data.id}`);
  expect(again.status).toBe(404);
  expectToMatchSpec(again, 'delete', '/api/bookmarks/{id}');
});

it('the migration created the GIN index used by tag filtering', async () => {
  const rows = await prisma.$queryRaw<Array<{ indexdef: string }>>`
    SELECT indexdef FROM pg_indexes WHERE tablename = 'bookmarks' AND indexdef ILIKE '%USING gin%'`;
  expect(rows).toHaveLength(1);
  expect(rows[0].indexdef).toContain('(tags)');
});

it('/ready reports the real database as up', async () => {
  const res = await request(app).get('/ready');
  expect(res.status).toBe(200);
  expect(res.body.data.checks).toEqual({ database: 'up' });
});
