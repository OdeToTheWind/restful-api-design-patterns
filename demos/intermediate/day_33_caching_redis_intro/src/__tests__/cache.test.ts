import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

// In-memory Redis with the real command semantics (GET/SET EX/DEL/INCR)
jest.mock('../lib/redis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RedisMock = require('ioredis-mock');
  return { __esModule: true, default: new RedisMock() };
});
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date();
const product = (name = 'Keyboard', priceCents = 4999) => ({
  id: ID,
  name,
  priceCents,
  createdAt: now,
  updatedAt: now,
});

beforeEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  await redis.flushall();
});

describe('GET /api/products/:id (cache-aside)', () => {
  it('loads from the database on a MISS, then serves the next request from Redis', async () => {
    jest.mocked(prisma.product.findUniqueOrThrow).mockResolvedValue(product());

    const first = await request(app).get(`/api/products/${ID}`);
    const second = await request(app).get(`/api/products/${ID}`);

    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body.data).toEqual(first.body.data);
    expect(prisma.product.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(await redis.ttl(`products:${ID}`)).toBeGreaterThan(0);
    expectToMatchSpec(second, 'get', '/api/products/{id}');
  });

  it('does not cache a 404', async () => {
    jest
      .mocked(prisma.product.findUniqueOrThrow)
      .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '5' }));

    expect((await request(app).get(`/api/products/${ID}`)).status).toBe(404);
    expect(await redis.exists(`products:${ID}`)).toBe(0);
  });
});

describe('invalidation on writes', () => {
  it('PATCH evicts the item, so the next read sees the new value', async () => {
    jest
      .mocked(prisma.product.findUniqueOrThrow)
      .mockResolvedValueOnce(product())
      .mockResolvedValueOnce(product('Keyboard', 3999));
    jest.mocked(prisma.product.update).mockResolvedValue(product('Keyboard', 3999));

    await request(app).get(`/api/products/${ID}`); // MISS → cached at 4999
    await request(app).patch(`/api/products/${ID}`).send({ priceCents: 3999 });
    const after = await request(app).get(`/api/products/${ID}`);

    expect(after.headers['x-cache']).toBe('MISS');
    expect(after.body.data.priceCents).toBe(3999);
  });

  it('any write bumps the list version, so cached lists are never served stale', async () => {
    jest
      .mocked(prisma.product.findMany)
      .mockResolvedValueOnce([product()])
      .mockResolvedValueOnce([product(), product('Mouse')]);
    jest.mocked(prisma.product.create).mockResolvedValue(product('Mouse'));

    expect((await request(app).get('/api/products')).headers['x-cache']).toBe('MISS');
    expect((await request(app).get('/api/products')).headers['x-cache']).toBe('HIT');

    await request(app).post('/api/products').send({ name: 'Mouse', priceCents: 1999 });
    const after = await request(app).get('/api/products');

    expect(after.headers['x-cache']).toBe('MISS');
    expect(after.body.data).toHaveLength(2);
    expect(await redis.get('products:version')).toBe('1');
  });

  it('DELETE evicts the item and bumps the list version', async () => {
    jest.mocked(prisma.product.delete).mockResolvedValue(product());
    await redis.set(`products:${ID}`, JSON.stringify(product()));

    expect((await request(app).delete(`/api/products/${ID}`)).status).toBe(200);
    expect(await redis.exists(`products:${ID}`)).toBe(0);
    expect(await redis.get('products:version')).toBe('1');
  });
});

describe('when Redis is down', () => {
  it('reads fall back to the database with X-Cache: BYPASS', async () => {
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('connect ECONNREFUSED'));
    jest.mocked(prisma.product.findUniqueOrThrow).mockResolvedValue(product());
    jest.mocked(prisma.product.findMany).mockResolvedValue([product()]);

    const one = await request(app).get(`/api/products/${ID}`);
    const list = await request(app).get('/api/products');

    expect([one.status, one.headers['x-cache']]).toEqual([200, 'BYPASS']);
    expect([list.status, list.headers['x-cache']]).toEqual([200, 'BYPASS']);
  });

  it('a failed cache write still returns the data (MISS)', async () => {
    jest.spyOn(redis, 'set').mockRejectedValue(new Error('READONLY'));
    jest.mocked(prisma.product.findUniqueOrThrow).mockResolvedValue(product());

    const res = await request(app).get(`/api/products/${ID}`);
    expect([res.status, res.headers['x-cache']]).toEqual([200, 'MISS']);
  });

  it('writes still succeed when invalidation fails (the TTL bounds staleness)', async () => {
    jest.spyOn(redis, 'del').mockRejectedValue(new Error('down'));
    jest.spyOn(redis, 'incr').mockRejectedValue(new Error('down'));
    jest.mocked(prisma.product.update).mockResolvedValue(product());

    expect((await request(app).patch(`/api/products/${ID}`).send({ name: 'Keyboard' })).status).toBe(200);
  });
});

describe('validation and app-level', () => {
  it('rejects bad input and malformed ids', async () => {
    expect((await request(app).post('/api/products').send({ name: '' })).status).toBe(400);
    expect((await request(app).get('/api/products/not-a-cuid')).status).toBe(400);
    expect((await request(app).patch(`/api/products/${ID}`).send({})).status).toBe(400);
  });

  it('serves docs and health', async () => {
    expect((await request(app).get('/api/docs/openapi.json')).body.paths['/api/products/{id}']).toBeDefined();
    expect((await request(app).get('/health')).status).toBe(200);
  });
});
