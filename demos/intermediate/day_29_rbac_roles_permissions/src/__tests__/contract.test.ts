import request, { Response } from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';
import { openApiDocument } from '../docs/openapi';
import { hashToken } from '../services/token.service';

/**
 * Contract tests: real responses must match the OpenAPI document served at /api/docs.
 * Objects are closed (unevaluatedProperties: false), so an undocumented field — such as a
 * leaked password hash — fails the test, not just a missing one.
 */
jest.mock('../lib/prisma', () => {
  const client = {
    user: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

type Json = Record<string, unknown>;
const doc = openApiDocument as unknown as { paths: Record<string, Record<string, Json>>; components: Json };

const components = doc.components as { schemas: Record<string, unknown> };

// Inline local $refs, then close every object schema. allOf branches stay open individually;
// the allOf node itself is closed, so properties from all branches together are allowed.
const prepare = (node: unknown, inAllOf = false): unknown => {
  if (Array.isArray(node)) return node.map((n) => prepare(n, inAllOf));
  if (typeof node !== 'object' || node === null) return node;
  const ref = (node as Json).$ref;
  if (typeof ref === 'string') {
    return prepare(components.schemas[ref.replace('#/components/schemas/', '')], inAllOf);
  }
  const out: Json = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = key === 'allOf' ? (value as unknown[]).map((v) => prepare(v, true)) : prepare(value);
  }
  const isObjectSchema = out.type === 'object' || 'allOf' in out;
  if (isObjectSchema && !inAllOf && !('additionalProperties' in out)) out.unevaluatedProperties = false;
  return out;
};

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

const expectToMatchSpec = (res: Response, method: string, path: string) => {
  const operation = doc.paths[path]?.[method] as { responses: Record<string, Json> } | undefined;
  expect(operation).toBeDefined();
  const documented = operation!.responses[String(res.status)];
  if (!documented) throw new Error(`${method.toUpperCase()} ${path} returned undocumented status ${res.status}`);
  const schema = (documented.content as Record<string, { schema: unknown }>)['application/json'].schema;
  const validate = ajv.compile(prepare(schema) as object);
  if (!validate(res.body)) {
    throw new Error(
      `${method.toUpperCase()} ${path} ${res.status} does not match the spec: ${ajv.errorsText(validate.errors)}`,
    );
  }
};

const now = new Date();
const dbUser = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  password: bcrypt.hashSync('correct-horse', 4),
  role: 'ADMIN' as const,
  createdAt: now,
  updatedAt: now,
};
const publicUser = {
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  role: dbUser.role,
  createdAt: now,
  updatedAt: now,
};
const token = (role = 'ADMIN') => jwt.sign({ id: 'user-1', email: 'ada@example.com', role }, config.jwtSecret);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.refreshToken.create).mockResolvedValue({ id: 'rt-new' } as never);
  jest.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
});

describe('Auth responses match the OpenAPI document', () => {
  it('POST /api/auth/register — 201, 400, 409', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    jest.mocked(prisma.user.create).mockResolvedValueOnce(publicUser as never);
    const created = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });
    expect(created.status).toBe(201);
    expectToMatchSpec(created, 'post', '/api/auth/register');

    const invalid = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expectToMatchSpec(invalid, 'post', '/api/auth/register');

    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(dbUser);
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });
    expect(duplicate.status).toBe(409);
    expectToMatchSpec(duplicate, 'post', '/api/auth/register');
  });

  it('POST /api/auth/login — 200 (no password in the user object), 401', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(dbUser);
    const ok = await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'correct-horse' });
    expect(ok.status).toBe(200);
    expectToMatchSpec(ok, 'post', '/api/auth/login');

    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    const denied = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-pass' });
    expect(denied.status).toBe(401);
    expectToMatchSpec(denied, 'post', '/api/auth/login');
  });

  it('POST /api/auth/refresh — 200, 401', async () => {
    jest.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce({
      id: 'rt-old',
      tokenHash: hashToken('old'),
      userId: 'user-1',
      replacedById: null,
      createdAt: now,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: dbUser,
    } as never);
    const ok = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old' });
    expect(ok.status).toBe(200);
    expectToMatchSpec(ok, 'post', '/api/auth/refresh');

    jest.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(null);
    const denied = await request(app).post('/api/auth/refresh').send({ refreshToken: 'unknown' });
    expectToMatchSpec(denied, 'post', '/api/auth/refresh');
  });

  it('POST /api/auth/logout — 200', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'old' });
    expectToMatchSpec(res, 'post', '/api/auth/logout');
  });

  it('GET /api/auth/me — 200, 401', async () => {
    expectToMatchSpec(
      await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token()}`),
      'get',
      '/api/auth/me',
    );
    expectToMatchSpec(await request(app).get('/api/auth/me'), 'get', '/api/auth/me');
  });
});

describe('User responses match the OpenAPI document', () => {
  it('GET /api/users — 200, 403', async () => {
    jest
      .mocked(prisma.user.findMany)
      .mockResolvedValueOnce([
        { id: 'user-1', name: 'Ada', email: 'ada@example.com', role: 'ADMIN', createdAt: now },
      ] as never);
    const ok = await request(app).get('/api/users').set('Authorization', `Bearer ${token()}`);
    expect(ok.status).toBe(200);
    expectToMatchSpec(ok, 'get', '/api/users');

    const forbidden = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token('USER')}`);
    expect(forbidden.status).toBe(403);
    expectToMatchSpec(forbidden, 'get', '/api/users');
  });

  it('GET /api/users/admin — 200', async () => {
    jest.mocked(prisma.user.count).mockResolvedValueOnce(3);
    const res = await request(app).get('/api/users/admin').set('Authorization', `Bearer ${token()}`);
    expectToMatchSpec(res, 'get', '/api/users/admin');
  });
});

describe('the contract check itself', () => {
  it('rejects a response with an undocumented field (e.g. a leaked password hash)', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    jest.mocked(prisma.user.create).mockResolvedValueOnce({ ...publicUser, password: 'hash' } as never);
    const leaky = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'correct-horse' });

    expect(() => expectToMatchSpec(leaky, 'post', '/api/auth/register')).toThrow(/does not match the spec/);
  });
});
