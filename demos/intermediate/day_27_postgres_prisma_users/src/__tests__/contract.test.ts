import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}));

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date();
const user = {
  id: ID,
  name: 'Ada',
  email: 'ada@example.com',
  age: null,
  role: 'USER' as const,
  createdAt: now,
  updatedAt: now,
};

it('responses match the OpenAPI document', async () => {
  jest.mocked(prisma.user.findMany).mockResolvedValue([user]);
  expectToMatchSpec(await request(app).get('/api/users'), 'get', '/api/users');

  jest.mocked(prisma.user.create).mockResolvedValue(user);
  expectToMatchSpec(
    await request(app).post('/api/users').send({ name: 'Ada', email: 'ada@example.com' }),
    'post',
    '/api/users',
  );

  jest
    .mocked(prisma.user.create)
    .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }));
  expectToMatchSpec(
    await request(app).post('/api/users').send({ name: 'Ada', email: 'ada@example.com' }),
    'post',
    '/api/users',
  );

  jest.mocked(prisma.user.update).mockResolvedValue(user);
  expectToMatchSpec(await request(app).put(`/api/users/${ID}`).send({ age: 37 }), 'put', '/api/users/{id}');

  jest.mocked(prisma.user.delete).mockResolvedValue(user);
  expectToMatchSpec(await request(app).delete(`/api/users/${ID}`), 'delete', '/api/users/{id}');
});
