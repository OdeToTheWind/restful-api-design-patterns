import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';

// No database needed: the Prisma singleton is replaced with mocks
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    refreshToken: { create: jest.fn() },
  },
}));

const findUnique = jest.mocked(prisma.user.findUnique);
const create = jest.mocked(prisma.user.create);

const now = new Date();
const dbUser = (overrides: Partial<{ role: 'USER' | 'ADMIN'; password: string }> = {}) => ({
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  password: bcrypt.hashSync('correct-horse', 4),
  role: 'USER' as const,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.refreshToken.create).mockResolvedValue({ id: 'rt-1' } as never);
});

describe('POST /api/auth/register', () => {
  it('creates a USER and ignores a client-supplied role', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(dbUser() as never);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ADA@example.com', password: 'correct-horse', role: 'ADMIN' });

    expect(res.status).toBe(201);
    const { data } = create.mock.calls[0][0];
    expect(data).not.toHaveProperty('role');
    expect(data.email).toBe('ada@example.com');
    expect(data.password).not.toBe('correct-horse');
  });

  it('never selects the password hash for the response', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(dbUser() as never);

    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });

    expect(create.mock.calls[0][0].select).not.toHaveProperty('password');
  });

  it.each([
    [{ email: 'ada@example.com', password: 'correct-horse' }, 'name'],
    [{ name: 'Ada', email: 'not-an-email', password: 'correct-horse' }, 'email'],
    [{ name: 'Ada', email: 'ada@example.com', password: 'short' }, 'password'],
  ])('rejects invalid input %p with 400', async (body, field) => {
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 409 when the email is taken', async () => {
    findUnique.mockResolvedValue(dbUser());

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });

    expect(res.status).toBe(409);
  });

  it('returns a generic 500 when the database fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    findUnique.mockRejectedValue(new Error('connection refused'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a JWT whose role comes from the database', async () => {
    findUnique.mockResolvedValue(dbUser({ role: 'ADMIN' }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(jwt.verify(res.body.data.token, config.jwtSecret)).toMatchObject({ id: 'user-1', role: 'ADMIN' });
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.expiresIn).toBe(15 * 60);
  });

  it.each([
    ['unknown email', null],
    ['wrong password', dbUser({ password: bcrypt.hashSync('something-else', 4) })],
  ])('returns the same 401 for %s', async (_case, user) => {
    findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-horse' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('still runs a bcrypt comparison for an unknown email (no timing leak)', async () => {
    findUnique.mockResolvedValue(null);
    const compare = jest.spyOn(bcrypt, 'compare');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correct-horse' });

    expect(res.status).toBe(401);
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  });
});

describe('CORS', () => {
  it('does not allow cross-origin requests unless CORS_ORIGIN is configured', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('GET /api/auth/me', () => {
  const sign = (payload: object, secret = config.jwtSecret) => jwt.sign(payload, secret);

  it('returns the user from a valid token', async () => {
    const token = sign({ id: 'user-1', email: 'ada@example.com', role: 'USER' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: 'user-1', email: 'ada@example.com', role: 'USER' });
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['forged signature', `Bearer ${sign({ id: 'x', email: 'x@x.x', role: 'ADMIN' }, 'attacker-secret')}`],
    ['malformed payload', `Bearer ${sign({ sub: 'x' })}`],
  ])('returns 401 for %s', async (_case, header) => {
    const req = request(app).get('/api/auth/me');
    const res = await (header ? req.set('Authorization', header) : req);

    expect(res.status).toBe(401);
  });
});

it('answers unknown routes with a JSON 404', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
});
