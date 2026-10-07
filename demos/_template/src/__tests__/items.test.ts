import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';

// No database needed: the Prisma singleton is replaced with mocks
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    item: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

const now = new Date();
const ID = 'clx0000000000000000000001';
const item = { id: ID, name: 'First', createdAt: now, updatedAt: now };
const knownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Simulated Prisma error', {
    code,
    clientVersion: Prisma.prismaVersion.client,
  });

beforeEach(() => jest.clearAllMocks());

describe('/api/items', () => {
  it('lists items', async () => {
    jest.mocked(prisma.item.findMany).mockResolvedValue([item]);
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('creates from whitelisted fields only', async () => {
    jest.mocked(prisma.item.create).mockResolvedValue(item);
    const res = await request(app).post('/api/items').send({ name: ' First ', id: 'client-chosen' });
    expect(res.status).toBe(201);
    expect(prisma.item.create).toHaveBeenCalledWith({ data: { name: 'First' } });
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app).post('/api/items').send({ name: '' });
    expect(res.status).toBe(400);
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('updates an item', async () => {
    jest.mocked(prisma.item.update).mockResolvedValue(item);
    expect((await request(app).put(`/api/items/${ID}`).send({ name: 'Renamed' })).status).toBe(200);
  });

  it('maps a missing record (P2025) to 404', async () => {
    jest.mocked(prisma.item.delete).mockRejectedValue(knownError('P2025'));
    expect((await request(app).delete('/api/items/clx0000000000000000000999')).status).toBe(404);
  });

  it('deletes an item', async () => {
    jest.mocked(prisma.item.delete).mockResolvedValue(item);
    expect((await request(app).delete(`/api/items/${ID}`)).status).toBe(200);
  });
});

describe('app-level middleware', () => {
  it('sets security headers and blocks unlisted origins', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.example');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('route params and health probes', () => {
  it('rejects a malformed id with 400 before querying', async () => {
    const res = await request(app).delete('/api/items/not-a-cuid');
    expect(res.status).toBe(400);
    expect(prisma.item.delete).not.toHaveBeenCalled();
  });

  it('GET /health is 200', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
  });

  it('GET /ready reflects the database', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([] as never);
    expect((await request(app).get('/ready')).status).toBe(200);

    jest.mocked(prisma.$queryRaw).mockRejectedValue(new Error('down') as never);
    expect((await request(app).get('/ready')).status).toBe(503);
  });
});

describe('API docs', () => {
  it('serves an OpenAPI 3.1 document covering the item routes', async () => {
    const res = await request(app).get('/api/docs/openapi.json');
    expect(res.body.openapi).toBe('3.1.0');
    expect(Object.keys(res.body.paths).sort()).toEqual(['/api/items', '/api/items/{id}']);
  });
});
