import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { config } from '../config';
import { openApiDocument } from '../docs/openapi';
import { hashToken } from '../services/session.service';

jest.mock('../lib/prisma', () => {
  const client = {
    user: { create: jest.fn(), findUnique: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const rt = jest.mocked(prisma.refreshToken);
const SESSION = '5b7c8a3e-1f2d-4c6b-9a0e-3d4f5a6b7c8d';
const OTHER = '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b';
const now = Date.now();
const user = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  password: bcrypt.hashSync('correct-horse', 4),
  createdAt: new Date(now),
  updatedAt: new Date(now),
};
const storedToken = (overrides: Record<string, unknown> = {}) => ({
  id: 'rt-old',
  tokenHash: hashToken('old-refresh'),
  sessionId: SESSION,
  sessionStartedAt: new Date(now - 3600_000),
  userId: 'user-1',
  userAgent: 'Firefox',
  ip: '10.0.0.1',
  expiresAt: new Date(now + 3600_000),
  revokedAt: null,
  replacedById: null,
  createdAt: new Date(now - 60_000),
  user,
  ...overrides,
});
const accessToken = (sid = SESSION) =>
  jwt.sign({ id: 'user-1', email: user.email, role: 'USER', sid }, config.jwtSecret);

/** Parses Set-Cookie headers into { name: { value, attributes } } */
const cookies = (res: request.Response) =>
  Object.fromEntries(
    ([] as string[]).concat(res.headers['set-cookie'] ?? []).map((line) => {
      const [pair, ...attrs] = line.split('; ');
      const [name, value] = pair.split('=');
      return [name, { value, attrs: attrs.map((a) => a.toLowerCase()) }];
    }),
  );
const withSession = (req: request.Test, csrf: string | null = 'csrf-123') => {
  req.set('Cookie', [`refresh_token=old-refresh`, `csrf_token=csrf-123`]);
  return csrf === null ? req : req.set('X-CSRF-Token', csrf);
};

beforeEach(() => {
  jest.clearAllMocks();
  rt.create.mockResolvedValue({ id: 'rt-new' } as never);
  rt.updateMany.mockResolvedValue({ count: 1 });
});

describe('login', () => {
  it('puts the refresh token in an httpOnly, SameSite=Strict cookie — never in the body', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Firefox')
      .send({ email: user.email, password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/refresh/i);
    const { refresh_token: refresh, csrf_token: csrf } = cookies(res);
    expect(refresh.attrs).toEqual(expect.arrayContaining(['httponly', 'samesite=strict', 'path=/api/auth']));
    expect(csrf.attrs).not.toContain('httponly');
    expect(rt.create.mock.calls[0][0].data).toMatchObject({
      tokenHash: hashToken(refresh.value),
      userAgent: 'Firefox',
    });
    expect(jwt.decode(res.body.data.token)).toMatchObject({ sid: rt.create.mock.calls[0][0].data.sessionId });
    expectToMatchSpec(res, 'post', '/api/auth/login');
  });
});

describe('refresh (cookie + CSRF)', () => {
  it.each([
    ['no CSRF header', null],
    ['a CSRF header that does not match the cookie', 'forged'],
  ])('rejects %s with 403 and does not touch the session', async (_case, csrf) => {
    const res = await withSession(request(app).post('/api/auth/refresh'), csrf);
    expect(res.status).toBe(403);
    expect(rt.findUnique).not.toHaveBeenCalled();
    expectToMatchSpec(res, 'post', '/api/auth/refresh');
  });

  it('rotates within the same session and sets new cookies', async () => {
    rt.findUnique.mockResolvedValue(storedToken() as never);

    const res = await withSession(request(app).post('/api/auth/refresh'));

    expect(res.status).toBe(200);
    const created = rt.create.mock.calls[0][0].data;
    expect(created.sessionId).toBe(SESSION);
    expect(created.sessionStartedAt).toEqual(storedToken().sessionStartedAt);
    expect(rt.update).toHaveBeenCalledWith({ where: { id: 'rt-old' }, data: { replacedById: 'rt-new' } });
    expect(cookies(res).refresh_token.value).not.toBe('old-refresh');
    expectToMatchSpec(res, 'post', '/api/auth/refresh');
  });

  it('reuse of a rotated token revokes every session and clears the cookies', async () => {
    rt.findUnique.mockResolvedValue(storedToken({ revokedAt: new Date(now - 1000) }) as never);

    const res = await withSession(request(app).post('/api/auth/refresh'));

    expect(res.status).toBe(401);
    expect(rt.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(cookies(res).refresh_token.attrs.join(';')).toMatch(/expires=thu, 01 jan 1970/);
  });

  it('401s without a cookie, for an expired session, or when a parallel refresh won', async () => {
    const noCookie = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'csrf_token=c')
      .set('X-CSRF-Token', 'c');
    expect(noCookie.status).toBe(401);

    rt.findUnique.mockResolvedValueOnce(storedToken({ expiresAt: new Date(now - 1) }) as never);
    expect((await withSession(request(app).post('/api/auth/refresh'))).body.message).toBe('Session expired');

    rt.findUnique.mockResolvedValueOnce(storedToken() as never);
    rt.updateMany.mockResolvedValueOnce({ count: 0 });
    expect((await withSession(request(app).post('/api/auth/refresh'))).status).toBe(401);

    rt.findUnique.mockResolvedValueOnce(null);
    expect((await withSession(request(app).post('/api/auth/refresh'))).status).toBe(401);
  });
});

describe('logout', () => {
  it('ends the whole session and clears both cookies', async () => {
    rt.findUnique.mockResolvedValue(storedToken() as never);

    const res = await withSession(request(app).post('/api/auth/logout'));

    expect(res.status).toBe(200);
    expect(rt.updateMany).toHaveBeenCalledWith({
      where: { sessionId: SESSION, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(Object.keys(cookies(res)).sort()).toEqual(['csrf_token', 'refresh_token']);
    expectToMatchSpec(res, 'post', '/api/auth/logout');
  });

  it('is idempotent without a cookie or for an unknown token', async () => {
    rt.findUnique.mockResolvedValue(null);
    expect((await withSession(request(app).post('/api/auth/logout'))).status).toBe(200);
    expect(
      (await request(app).post('/api/auth/logout').set('Cookie', 'csrf_token=c').set('X-CSRF-Token', 'c')).status,
    ).toBe(200);
  });
});

describe('session management (bearer token)', () => {
  it('lists active sessions and marks the current one', async () => {
    rt.findMany.mockResolvedValue([
      storedToken(),
      storedToken({ id: 'rt-2', sessionId: OTHER, userAgent: 'Safari' }),
    ] as never);

    const res = await request(app).get('/api/auth/sessions').set('Authorization', `Bearer ${accessToken()}`);

    expect(res.body.data.map((s: { id: string; current: boolean }) => [s.id, s.current])).toEqual([
      [SESSION, true],
      [OTHER, false],
    ]);
    expect(rt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1', revokedAt: null }) }),
    );
    expectToMatchSpec(res, 'get', '/api/auth/sessions');
  });

  it('revokes one of your own sessions; anything else is 404', async () => {
    const ok = await request(app).delete(`/api/auth/sessions/${OTHER}`).set('Authorization', `Bearer ${accessToken()}`);
    expect(rt.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', sessionId: OTHER, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expectToMatchSpec(ok, 'delete', '/api/auth/sessions/{id}');

    rt.updateMany.mockResolvedValueOnce({ count: 0 });
    const notMine = await request(app)
      .delete(`/api/auth/sessions/${OTHER}`)
      .set('Authorization', `Bearer ${accessToken()}`);
    expect(notMine.status).toBe(404);
    expectToMatchSpec(notMine, 'delete', '/api/auth/sessions/{id}');
  });

  it('signs out everywhere else but keeps the current session', async () => {
    rt.updateMany.mockResolvedValueOnce({ count: 3 });

    const res = await request(app).delete('/api/auth/sessions').set('Authorization', `Bearer ${accessToken()}`);

    expect(res.body.data).toEqual({ revoked: 3 });
    expect(rt.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null, NOT: { sessionId: SESSION } },
      data: { revokedAt: expect.any(Date) },
    });
    expectToMatchSpec(res, 'delete', '/api/auth/sessions');
  });

  it('requires a valid bearer token', async () => {
    expectToMatchSpec(await request(app).get('/api/auth/sessions'), 'get', '/api/auth/sessions');
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer nope')).status).toBe(401);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken()}`);
    expectToMatchSpec(me, 'get', '/api/auth/me');
  });
});

describe('register and app-level', () => {
  it('registers a user and rejects bad input', async () => {
    jest
      .mocked(prisma.user.create)
      .mockResolvedValue({ id: 'u', name: 'Ada', email: 'a@b.co', createdAt: new Date() } as never);
    expectToMatchSpec(
      await request(app).post('/api/auth/register').send({ name: 'Ada', email: 'a@b.co', password: 'correct-horse' }),
      'post',
      '/api/auth/register',
    );
    expect((await request(app).post('/api/auth/register').send({ email: 'x' })).status).toBe(400);
  });

  it('wrong password is 401; health and docs are served', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    expect((await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' })).status).toBe(401);
    expect((await request(app).get('/health')).status).toBe(200);
    expect(
      (await request(app).get('/api/docs/openapi.json')).body.components.securitySchemes.refreshCookie,
    ).toBeDefined();
  });
});
