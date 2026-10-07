import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date('2026-10-08T09:30:00Z');
const user = {
  id: ID,
  email: 'ada@example.com',
  passwordHash: bcrypt.hashSync('correct-horse', 4),
  displayName: 'Ada',
  bio: null,
  role: 'USER' as const,
  internalNotes: 'Flagged for review',
  lastLoginAt: null,
  createdAt: now,
  updatedAt: now,
};
const tokenFor = (role: 'USER' | 'ADMIN') => jwt.sign({ id: ID, email: user.email, role }, config.jwtSecret);
const bearer = (role: 'USER' | 'ADMIN') => ({ Authorization: `Bearer ${tokenFor(role)}` });

beforeEach(() => jest.clearAllMocks());

it('register returns the private view built from the input DTO (role is ignored)', async () => {
  jest.mocked(prisma.user.create).mockResolvedValue(user);

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'ADA@example.com', password: 'correct-horse', displayName: 'Ada', role: 'ADMIN' });

  expect(res.status).toBe(201);
  const { data } = jest.mocked(prisma.user.create).mock.calls[0][0];
  expect(Object.keys(data).sort()).toEqual(['displayName', 'email', 'passwordHash']);
  expect(data.email).toBe('ada@example.com');
  expectToMatchSpec(res, 'post', '/api/auth/register');
});

it('login records the time and returns a token + private view', async () => {
  jest.mocked(prisma.user.findUnique).mockResolvedValue(user);
  jest.mocked(prisma.user.update).mockResolvedValue({ ...user, lastLoginAt: now });

  const ok = await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'correct-horse' });
  expect(ok.body.data.user.lastLoginAt).toBe(now.toISOString());
  expectToMatchSpec(ok, 'post', '/api/auth/login');

  jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
  const denied = await request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'nope' });
  expect(denied.status).toBe(401);
});

it('the same user looks different to the public, to themselves and to an admin', async () => {
  jest.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(user);
  jest.mocked(prisma.user.findMany).mockResolvedValue([user]);

  const asPublic = await request(app).get(`/api/users/${ID}`);
  const asSelf = await request(app).get('/api/me').set(bearer('USER'));
  const asAdmin = await request(app).get('/api/admin/users').set(bearer('ADMIN'));

  expect(asPublic.body.data).not.toHaveProperty('email');
  expect(asSelf.body.data.email).toBe('ada@example.com');
  expect(asSelf.body.data).not.toHaveProperty('internalNotes');
  expect(asAdmin.body.data[0].internalNotes).toBe('Flagged for review');
  for (const res of [asPublic, asSelf, asAdmin]) expect(JSON.stringify(res.body)).not.toContain('$2a$');

  expectToMatchSpec(asPublic, 'get', '/api/users/{id}');
  expectToMatchSpec(asSelf, 'get', '/api/me');
  expectToMatchSpec(asAdmin, 'get', '/api/admin/users');
});

it('profile and notes updates go through their own input DTOs', async () => {
  jest.mocked(prisma.user.update).mockResolvedValue({ ...user, bio: 'Hi' });

  const me = await request(app).patch('/api/me').set(bearer('USER')).send({ bio: 'Hi', role: 'ADMIN' });
  expect(jest.mocked(prisma.user.update).mock.calls[0][0].data).toEqual({ bio: 'Hi' });
  expectToMatchSpec(me, 'patch', '/api/me');

  const notes = await request(app)
    .patch(`/api/admin/users/${ID}/notes`)
    .set(bearer('ADMIN'))
    .send({ internalNotes: 'OK' });
  expectToMatchSpec(notes, 'patch', '/api/admin/users/{id}/notes');
});

it('enforces authentication and the admin role', async () => {
  expectToMatchSpec(await request(app).get('/api/me'), 'get', '/api/me');
  expectToMatchSpec(await request(app).get('/api/admin/users').set(bearer('USER')), 'get', '/api/admin/users');
  expect((await request(app).get('/api/me').set('Authorization', 'Bearer forged')).status).toBe(401);
  const wrongPayload = jwt.sign({ sub: 'x' }, config.jwtSecret);
  expect((await request(app).get('/api/me').set('Authorization', `Bearer ${wrongPayload}`)).status).toBe(401);
});

it('maps missing users and duplicate emails', async () => {
  jest
    .mocked(prisma.user.findUniqueOrThrow)
    .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('none', { code: 'P2025', clientVersion: '5' }));
  expect((await request(app).get(`/api/users/${ID}`)).status).toBe(404);

  jest
    .mocked(prisma.user.create)
    .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }));
  const dup = await request(app)
    .post('/api/auth/register')
    .send({ email: 'a@b.co', password: 'correct-horse', displayName: 'A' });
  expectToMatchSpec(dup, 'post', '/api/auth/register');
});

it('serves health and docs', async () => {
  expect((await request(app).get('/health')).status).toBe(200);
  expect((await request(app).get('/api/docs/openapi.json')).body.components.schemas.AdminUser).toBeDefined();
});
