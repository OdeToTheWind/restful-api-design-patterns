import request from 'supertest';
import bcrypt from 'bcryptjs';
import type { Application } from 'express';

const mockRealUser = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  password: bcrypt.hashSync('correct-horse', 4),
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(({ where }: { where: { email: string } }) =>
        Promise.resolve(where.email === 'ada@example.com' ? mockRealUser : null),
      ),
    },
    refreshToken: { create: jest.fn().mockResolvedValue({ id: 'rt-1' }) },
  },
}));

// Limits are read when config loads, so each scenario loads a fresh copy of the app
const loadApp = (env: Record<string, string>): Application => {
  Object.assign(process.env, env);
  let app!: Application;
  jest.isolateModules(() => {
    app = jest.requireActual('../app').default;
  });
  return app;
};

const login = (app: Application, email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

describe('per-IP limit (AUTH_RATE_LIMIT)', () => {
  it('blocks the 4th auth request from the same IP with 429', async () => {
    const app = loadApp({ AUTH_RATE_LIMIT: '3', LOGIN_ACCOUNT_LIMIT: '1000' });

    for (let i = 0; i < 3; i++) {
      expect((await login(app, `user${i}@example.com`, 'guess')).status).toBe(401);
    }

    const blocked = await login(app, 'someone@example.com', 'guess');
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});

describe('per-account limit (LOGIN_ACCOUNT_LIMIT)', () => {
  it('locks an account after N failed logins, without affecting other accounts', async () => {
    const app = loadApp({ AUTH_RATE_LIMIT: '1000', LOGIN_ACCOUNT_LIMIT: '2' });

    expect((await login(app, 'victim@example.com', 'guess-1')).status).toBe(401);
    expect((await login(app, 'VICTIM@example.com', 'guess-2')).status).toBe(401); // same account after normalising

    const blocked = await login(app, 'victim@example.com', 'guess-3');
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/this account/);

    expect((await login(app, 'other@example.com', 'guess')).status).toBe(401);
  });

  it('does not count successful logins', async () => {
    const app = loadApp({ AUTH_RATE_LIMIT: '1000', LOGIN_ACCOUNT_LIMIT: '2' });

    for (let i = 0; i < 5; i++) {
      expect((await login(app, 'ada@example.com', 'correct-horse')).status).toBe(200);
    }
  });
});
