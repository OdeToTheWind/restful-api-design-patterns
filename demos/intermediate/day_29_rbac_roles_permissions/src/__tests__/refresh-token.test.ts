import request from 'supertest';
import jwt, { JwtPayload } from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';
import { hashToken } from '../services/token.service';

// Prisma mocked; $transaction runs the callback against the same mock client
jest.mock('../lib/prisma', () => {
  const client = {
    user: { findUnique: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

const rt = jest.mocked(prisma.refreshToken);
const now = Date.now();
const user = {
  id: 'user-1', name: 'Ada', email: 'ada@example.com', password: 'hash',
  role: 'ADMIN' as const, createdAt: new Date(now), updatedAt: new Date(now),
};
const stored = (overrides: Partial<{ revokedAt: Date | null; expiresAt: Date }> = {}) => ({
  id: 'rt-old', tokenHash: hashToken('old-token'), userId: user.id, replacedById: null,
  createdAt: new Date(now), revokedAt: null, expiresAt: new Date(now + 60_000), user,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  rt.create.mockResolvedValue({ id: 'rt-new' } as never);
  rt.updateMany.mockResolvedValue({ count: 1 });
});

describe('POST /api/auth/refresh', () => {
  it('rotates: revokes the old token, links it to the new one and returns a fresh pair', async () => {
    rt.findUnique.mockResolvedValue(stored() as never);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    expect(res.status).toBe(200);
    expect(rt.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { tokenHash: hashToken('old-token') } }));
    expect(rt.updateMany).toHaveBeenCalledWith({ where: { id: 'rt-old', revokedAt: null }, data: { revokedAt: expect.any(Date) } });
    expect(rt.update).toHaveBeenCalledWith({ where: { id: 'rt-old' }, data: { replacedById: 'rt-new' } });
    expect(res.body.data.refreshToken).not.toBe('old-token');
    expect(jwt.verify(res.body.data.token, config.jwtSecret)).toMatchObject({ id: 'user-1', role: 'ADMIN' });
  });

  it('stores only the hash of the new refresh token', async () => {
    rt.findUnique.mockResolvedValue(stored() as never);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    const { data } = rt.create.mock.calls[0][0];
    expect(data.tokenHash).toBe(hashToken(res.body.data.refreshToken));
    expect(JSON.stringify(data)).not.toContain(res.body.data.refreshToken);
  });

  it('issues access tokens that expire after 15 minutes', async () => {
    rt.findUnique.mockResolvedValue(stored() as never);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    const { iat, exp } = jwt.decode(res.body.data.token) as JwtPayload;
    expect(exp! - iat!).toBe(15 * 60);
    expect(res.body.data.expiresIn).toBe(15 * 60);
  });

  it('treats reuse of a revoked token as theft and revokes every session of that user', async () => {
    rt.findUnique.mockResolvedValue(stored({ revokedAt: new Date(now - 1000) }) as never);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    expect(res.status).toBe(401);
    expect(rt.updateMany).toHaveBeenCalledWith({ where: { userId: 'user-1', revokedAt: null }, data: { revokedAt: expect.any(Date) } });
    expect(rt.create).not.toHaveBeenCalled();
  });

  it('rejects an expired token without rotating', async () => {
    rt.findUnique.mockResolvedValue(stored({ expiresAt: new Date(now - 1) }) as never);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token expired');
    expect(rt.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown token', async () => {
    rt.findUnique.mockResolvedValue(null);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'nope' })).status).toBe(401);
  });

  it('loses the race cleanly when a parallel request already rotated the token', async () => {
    rt.findUnique.mockResolvedValue(stored() as never);
    rt.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

    expect(res.status).toBe(401);
    expect(rt.create).not.toHaveBeenCalled();
  });

  it('requires a refreshToken in the body', async () => {
    expect((await request(app).post('/api/auth/refresh').send({})).status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the presented refresh token by hash', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'old-token' });

    expect(res.status).toBe(200);
    expect(rt.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('old-token'), revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('is idempotent for unknown or already-revoked tokens', async () => {
    rt.updateMany.mockResolvedValue({ count: 0 });
    expect((await request(app).post('/api/auth/logout').send({ refreshToken: 'gone' })).status).toBe(200);
  });
});
