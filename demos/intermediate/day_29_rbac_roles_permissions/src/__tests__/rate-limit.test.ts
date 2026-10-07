import request from 'supertest';
import type { Application } from 'express';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn().mockResolvedValue(null) } },
}));

describe('auth rate limiting', () => {
  let app: Application;

  beforeAll(() => {
    // Must be set before config is loaded, so load the app afterwards
    process.env.AUTH_RATE_LIMIT = '3';
    app = jest.requireActual('../app').default;
  });

  it('blocks the 4th login attempt from the same IP with 429', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'guess' });

    for (let i = 0; i < 3; i++) {
      expect((await attempt()).status).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});
