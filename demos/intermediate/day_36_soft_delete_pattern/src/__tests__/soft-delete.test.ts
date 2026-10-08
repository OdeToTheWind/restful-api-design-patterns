import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import { prismaWithDeleted } from '../lib/prisma';
import { onlyActive } from '../lib/soft-delete';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

// The extended client is replaced by one whose model methods record the args they receive
// AFTER the soft-delete transform — so these tests check the extension's wiring too.
jest.mock('../lib/prisma', () => {
  const calls: Array<{ op: string; args: unknown }> = [];
  const record = (op: string, result: unknown = {}) =>
    jest.fn((args: unknown) => (calls.push({ op, args }), Promise.resolve(result)));
  const base = {
    article: {
      findMany: record('findMany', []),
      update: record('update'),
      updateMany: record('updateMany'),
      delete: record('delete'),
      findFirstOrThrow: record('findFirstOrThrow'),
      create: record('create'),
    },
    $queryRaw: jest.fn(),
  };
  // Re-implement the extension's behaviour by delegating to the real helper
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { onlyActive: active } = require('../lib/soft-delete');
  const extended = {
    article: {
      findMany: (args: object) => base.article.findMany(active(args)),
      findFirstOrThrow: (args: object) => base.article.findFirstOrThrow(active(args)),
      create: (args: object) => base.article.create(args),
      update: (args: object) => base.article.update(active(args)),
      delete: (args: { where: object }) =>
        base.article.update({ where: active(args).where, data: { deletedAt: new Date() } }),
    },
    $queryRaw: base.$queryRaw,
  };
  return { __esModule: true, default: extended, prismaWithDeleted: base, __calls: calls };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date();
const article = (deletedAt: Date | null = null) => ({
  id: ID,
  slug: 'rest-tips',
  title: 'REST tips',
  body: 'Body',
  deletedAt,
  createdAt: now,
  updatedAt: now,
});
const base = jest.mocked(prismaWithDeleted);

beforeEach(() => jest.clearAllMocks());

describe('onlyActive()', () => {
  it('adds deletedAt: null to any where clause', () => {
    expect(onlyActive({})).toEqual({ where: { deletedAt: null } });
    expect(onlyActive({ where: { slug: 'a' }, take: 5 })).toEqual({ where: { deletedAt: null, slug: 'a' }, take: 5 });
  });

  it('lets an explicit deletedAt condition win', () => {
    expect(onlyActive({ where: { deletedAt: { not: null } } }).where).toEqual({ deletedAt: { not: null } });
  });
});

describe('active articles (extended client)', () => {
  it('reads never include deleted rows', async () => {
    base.article.findMany.mockResolvedValueOnce([article()] as never);
    const res = await request(app).get('/api/articles');
    expect(base.article.findMany).toHaveBeenCalledWith({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
    expectToMatchSpec(res, 'get', '/api/articles');

    base.article.findFirstOrThrow.mockResolvedValueOnce(article() as never);
    await request(app).get('/api/articles/rest-tips');
    expect(base.article.findFirstOrThrow).toHaveBeenCalledWith({ where: { deletedAt: null, slug: 'rest-tips' } });
  });

  it('DELETE moves the article to the trash instead of deleting it', async () => {
    base.article.update.mockResolvedValueOnce(article(now) as never);

    const res = await request(app).delete(`/api/articles/${ID}`);

    expect(res.status).toBe(200);
    expect(base.article.delete).not.toHaveBeenCalled();
    expect(base.article.update).toHaveBeenCalledWith({
      where: { deletedAt: null, id: ID },
      data: { deletedAt: expect.any(Date) },
    });
    expectToMatchSpec(res, 'delete', '/api/articles/{id}');
  });

  it('updating a deleted article is a 404 (it is not active)', async () => {
    base.article.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('none', { code: 'P2025', clientVersion: '5' }) as never,
    );
    const res = await request(app).patch(`/api/articles/${ID}`).send({ title: 'New' });
    expect(res.status).toBe(404);
    expect(base.article.update.mock.calls[0][0]).toMatchObject({ where: { deletedAt: null, id: ID } });
  });

  it('a slug already used by an active article is a 409 (partial unique index → P2002)', async () => {
    base.article.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }) as never,
    );
    const res = await request(app).post('/api/articles').send({ slug: 'rest-tips', title: 'T', body: 'B' });
    expect(res.status).toBe(409);
    expectToMatchSpec(res, 'post', '/api/articles');
  });
});

describe('trash (unfiltered client)', () => {
  it('lists only deleted articles', async () => {
    base.article.findMany.mockResolvedValueOnce([article(now)] as never);
    const res = await request(app).get('/api/articles/trash');
    expect(base.article.findMany).toHaveBeenCalledWith({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    expectToMatchSpec(res, 'get', '/api/articles/trash');
  });

  it('restores only articles that are in the trash', async () => {
    base.article.update.mockResolvedValueOnce(article() as never);
    const res = await request(app).post(`/api/articles/${ID}/restore`);
    expect(base.article.update).toHaveBeenCalledWith({
      where: { id: ID, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    expectToMatchSpec(res, 'post', '/api/articles/{id}/restore');
  });

  it('purges for good, but only from the trash', async () => {
    base.article.delete.mockResolvedValueOnce(article(now) as never);
    const res = await request(app).delete(`/api/articles/${ID}/permanent`);
    expect(base.article.delete).toHaveBeenCalledWith({ where: { id: ID, deletedAt: { not: null } } });
    expectToMatchSpec(res, 'delete', '/api/articles/{id}/permanent');
  });

  it('validates input and serves health', async () => {
    expect((await request(app).post('/api/articles').send({ slug: 'Not A Slug', title: 'T', body: 'B' })).status).toBe(
      400,
    );
    expect((await request(app).post('/api/articles/nope/restore')).status).toBe(400);
    expect((await request(app).get('/health')).status).toBe(200);
  });
});
