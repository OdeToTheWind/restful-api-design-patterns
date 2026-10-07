import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';
import { openApiDocument } from '../docs/openapi';

jest.mock('../lib/prisma', () => {
  const client = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const now = new Date();
const user = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  password: bcrypt.hashSync('correct-horse', 4),
  role: 'USER' as const,
  createdAt: now,
  updatedAt: now,
};

it('responses match the OpenAPI document — no password field anywhere', async () => {
  jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
  const { password: _password, ...publicUser } = user;
  jest.mocked(prisma.user.create).mockResolvedValue(publicUser as never);
  expectToMatchSpec(
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' }),
    'post',
    '/api/auth/register',
  );

  jest.mocked(prisma.user.findUnique).mockResolvedValue(user);
  jest.mocked(prisma.refreshToken.create).mockResolvedValue({ id: 'rt1' } as never);
  expectToMatchSpec(
    await request(app).post('/api/auth/login').send({ email: user.email, password: 'correct-horse' }),
    'post',
    '/api/auth/login',
  );

  jest.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);
  expectToMatchSpec(
    await request(app).post('/api/auth/refresh').send({ refreshToken: 'x' }),
    'post',
    '/api/auth/refresh',
  );

  jest.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
  expectToMatchSpec(
    await request(app).post('/api/auth/logout').send({ refreshToken: 'x' }),
    'post',
    '/api/auth/logout',
  );

  const token = jwt.sign({ id: 'u1', email: user.email, role: 'USER' }, config.jwtSecret);
  expectToMatchSpec(
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`),
    'get',
    '/api/auth/me',
  );
});
