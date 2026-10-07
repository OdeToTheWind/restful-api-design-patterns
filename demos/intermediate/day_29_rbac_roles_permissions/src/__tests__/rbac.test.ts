import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(42) } },
}));

const tokenFor = (role: string) => jwt.sign({ id: 'user-1', email: 'ada@example.com', role }, config.jwtSecret);

describe('GET /api/users/admin (ADMIN only)', () => {
  it('returns 401 without a token', async () => {
    expect((await request(app).get('/api/users/admin')).status).toBe(401);
  });

  it.each(['USER', 'MODERATOR'])('returns 403 for %s', async (role) => {
    const res = await request(app).get('/api/users/admin').set('Authorization', `Bearer ${tokenFor(role)}`);
    expect(res.status).toBe(403);
  });

  it('returns real stats for ADMIN', async () => {
    const res = await request(app).get('/api/users/admin').set('Authorization', `Bearer ${tokenFor('ADMIN')}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalUsers).toBe(42);
  });
});

describe('GET /api/users (ADMIN or MODERATOR)', () => {
  it('returns 403 for USER and does not query the database', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokenFor('USER')}`);
    expect(res.status).toBe(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'MODERATOR'])('returns 200 for %s', async (role) => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokenFor(role)}`);
    expect(res.status).toBe(200);
  });
});
