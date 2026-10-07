import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}));

const create = jest.mocked(prisma.user.create);
const update = jest.mocked(prisma.user.update);
const remove = jest.mocked(prisma.user.delete);

const knownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Simulated Prisma error', { code, clientVersion: Prisma.prismaVersion.client });

const now = new Date();
const ada = { id: 'u1', name: 'Ada', email: 'ada@example.com', age: 36, role: 'USER' as const, createdAt: now, updatedAt: now };

beforeEach(() => jest.clearAllMocks());

describe('POST /api/users', () => {
  it('creates a user from whitelisted fields only (no role)', async () => {
    create.mockResolvedValue(ada);

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Ada', email: 'ADA@example.com', age: 36, role: 'ADMIN', id: 'chosen-by-client' });

    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith({ data: { name: 'Ada', email: 'ada@example.com', age: 36 } });
  });

  it.each([
    [{ email: 'ada@example.com' }, 'name'],
    [{ name: 'Ada', email: 'nope' }, 'email'],
    [{ name: 'Ada', email: 'ada@example.com', age: -1 }, 'age'],
  ])('rejects %p with 400', async (body, field) => {
    const res = await request(app).post('/api/users').send(body);

    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it('maps a duplicate email (P2002) to 409', async () => {
    create.mockRejectedValue(knownError('P2002'));

    const res = await request(app).post('/api/users').send({ name: 'Ada', email: 'ada@example.com' });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/users/:id', () => {
  it('cannot change role through an update', async () => {
    update.mockResolvedValue(ada);

    const res = await request(app).put('/api/users/u1').send({ name: 'Ada L.', role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { name: 'Ada L.' } });
  });

  it('maps a missing record (P2025) to 404', async () => {
    update.mockRejectedValue(knownError('P2025'));

    const res = await request(app).put('/api/users/missing').send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('GET and DELETE /api/users', () => {
  it('lists users newest first', async () => {
    jest.mocked(prisma.user.findMany).mockResolvedValue([ada]);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });

  it('deletes a user', async () => {
    remove.mockResolvedValue(ada);
    expect((await request(app).delete('/api/users/u1')).status).toBe(200);
  });

  it('returns 404 when deleting a missing user', async () => {
    remove.mockRejectedValue(knownError('P2025'));
    expect((await request(app).delete('/api/users/missing')).status).toBe(404);
  });
});

describe('app-level middleware', () => {
  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('does not allow cross-origin requests unless CORS_ORIGIN is configured', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
