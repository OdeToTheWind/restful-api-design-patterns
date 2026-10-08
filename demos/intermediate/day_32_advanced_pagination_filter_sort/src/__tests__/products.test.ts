import request from 'supertest';
import { encodeCursor } from '@restful/shared';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';
import { buildOrderBy, buildWhere } from '../controllers/product.controller';

jest.mock('../lib/prisma', () => {
  const client = {
    product: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    $queryRaw: jest.fn(),
  };
  return { __esModule: true, default: client };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const product = (n: number, createdAt = new Date(Date.UTC(2026, 0, n))) => ({
  id: `clx00000000000000000000${String(n).padStart(2, '0')}`,
  name: `Product ${n}`,
  category: 'books',
  priceCents: n * 100,
  stock: n,
  createdAt,
});

beforeEach(() => jest.clearAllMocks());

describe('buildWhere / buildOrderBy', () => {
  it('combines only the filters that were given', () => {
    expect(buildWhere({})).toEqual({});
    expect(buildWhere({ category: 'books', q: 'code', minPrice: 100 })).toEqual({
      category: 'books',
      name: { contains: 'code', mode: 'insensitive' },
      priceCents: { gte: 100, lte: undefined },
    });
  });

  it('maps the public sort key to a column and adds an id tie-breaker', () => {
    expect(buildOrderBy('-price')).toEqual([{ priceCents: 'desc' }, { id: 'desc' }]);
    expect(buildOrderBy('name')).toEqual([{ name: 'asc' }, { id: 'asc' }]);
  });
});

describe('GET /api/products (offset)', () => {
  it('applies filters, sort and paging, and returns page metadata', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([product(3), product(4)]);
    jest.mocked(prisma.product.count).mockResolvedValue(12);

    const res = await request(app).get(
      '/api/products?category=Books&minPrice=100&maxPrice=900&sort=-price&page=2&pageSize=2',
    );

    expect(res.status).toBe(200);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { category: 'books', priceCents: { gte: 100, lte: 900 } },
      orderBy: [{ priceCents: 'desc' }, { id: 'desc' }],
      skip: 2,
      take: 2,
    });
    expect(res.body.data.meta).toEqual({
      page: 2,
      pageSize: 2,
      totalItems: 12,
      totalPages: 6,
      hasNextPage: true,
      hasPreviousPage: true,
    });
    expectToMatchSpec(res, 'get', '/api/products');
  });

  it('defaults to newest first, 20 per page', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([]);
    jest.mocked(prisma.product.count).mockResolvedValue(0);

    await request(app).get('/api/products');

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: 0, take: 20 }),
    );
  });

  it.each([
    ['?sort=password', 'sort'],
    ['?sort=-stock', 'sort'],
    ['?pageSize=500', 'pageSize'],
    ['?page=0', 'page'],
    ['?minPrice=900&maxPrice=100', 'minPrice'],
  ])('rejects %s with 400', async (query, field) => {
    const res = await request(app).get(`/api/products${query}`);
    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });
});

describe('GET /api/products/feed (cursor)', () => {
  it('fetches limit+1 rows and returns a cursor for the last row shown', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([product(9), product(8), product(7)]);

    const res = await request(app).get('/api/products/feed?limit=2');

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
    });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.meta).toEqual({
      limit: 2,
      hasNextPage: true,
      nextCursor: encodeCursor(`${product(8).createdAt.toISOString()}|${product(8).id}`),
    });
    expectToMatchSpec(res, 'get', '/api/products/feed');
  });

  it('continues strictly after the cursor position (keyset)', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([product(7)]);
    const last = product(8);

    const res = await request(app).get(
      `/api/products/feed?limit=2&category=books&cursor=${encodeCursor(`${last.createdAt.toISOString()}|${last.id}`)}`,
    );

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          category: 'books',
          OR: [{ createdAt: { lt: last.createdAt } }, { createdAt: last.createdAt, id: { lt: last.id } }],
        },
      }),
    );
    expect(res.body.data.meta).toEqual({ limit: 2, hasNextPage: false, nextCursor: null });
  });

  it.each([
    ['a cursor it did not issue', `cursor=${encodeURIComponent('not-ours!')}`],
    ['a well-encoded but malformed cursor', `cursor=${encodeCursor('garbage')}`],
    ['offset params on the cursor feed', 'page=2'],
  ])('rejects %s with 400', async (_case, query) => {
    const res = await request(app).get(`/api/products/feed?${query}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/products', () => {
  it('creates a product with a normalised category', async () => {
    jest.mocked(prisma.product.create).mockResolvedValue(product(1));

    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Clean Code', category: ' Books ', priceCents: 3999 });

    expect(res.status).toBe(201);
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: { name: 'Clean Code', category: 'books', priceCents: 3999, stock: 0 },
    });
    expectToMatchSpec(res, 'post', '/api/products');
  });

  it('rejects fractional cents', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X', category: 'a', priceCents: 9.99 });
    expect(res.status).toBe(400);
  });
});

describe('app-level', () => {
  it('serves docs, health and readiness', async () => {
    expect((await request(app).get('/api/docs/openapi.json')).body.paths['/api/products/feed']).toBeDefined();
    expect((await request(app).get('/health')).status).toBe(200);
    jest.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('down') as never);
    expect((await request(app).get('/ready')).status).toBe(503);
  });
});
