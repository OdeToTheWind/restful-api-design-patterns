import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import { AppConfig } from '../config';
import { openApiDocument } from '../docs/openapi';

const expectToMatchSpec = createContractMatcher(openApiDocument);
const KEY = 'k'.repeat(32);

// Because the app takes its config as an argument, each test builds exactly the setup it needs
const configWith = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  environment: 'test',
  port: 0,
  logLevel: 'error',
  corsOrigins: [],
  rateLimitPerMinute: 1000,
  features: { newGreeting: false },
  adminApiKey: KEY,
  loadedFiles: ['.env.test'],
  ...overrides,
});

it('the greeting follows the feature flag', async () => {
  const off = await request(createApp(configWith())).get('/api/greeting');
  const on = await request(createApp(configWith({ features: { newGreeting: true } }))).get('/api/greeting');

  expect(off.body.data.message).toBe('Hello from Day 49!');
  expect(on.body.data.message).toMatch(/enabled by FEATURE_NEW_GREETING in test/);
  expectToMatchSpec(on, 'get', '/api/greeting');
});

it('/api/info exposes non-secret settings only', async () => {
  const res = await request(createApp(configWith())).get('/api/info');
  expect(res.body.data).toEqual({ environment: 'test', features: { newGreeting: false }, rateLimitPerMinute: 1000 });
  expect(JSON.stringify(res.body)).not.toContain(KEY);
  expectToMatchSpec(res, 'get', '/api/info');
});

describe('/api/admin/config', () => {
  it('returns the redacted config for the right key', async () => {
    const res = await request(createApp(configWith())).get('/api/admin/config').set('X-Admin-Key', KEY);
    expect(res.status).toBe(200);
    expectToMatchSpec(res, 'get', '/api/admin/config');
    expect(res.body.data.adminApiKey).toBe('[set]');
    expect(res.body.data.loadedFiles).toEqual(['.env.test']);
    expect(JSON.stringify(res.body)).not.toContain(KEY);
  });

  it('401 for a wrong or missing key, 404 when no key is configured', async () => {
    const app = createApp(configWith());
    expectToMatchSpec(
      await request(app).get('/api/admin/config').set('X-Admin-Key', 'x'.repeat(32)),
      'get',
      '/api/admin/config',
    );
    expect((await request(app).get('/api/admin/config')).status).toBe(401);

    const disabled = await request(createApp(configWith({ adminApiKey: undefined })))
      .get('/api/admin/config')
      .set('X-Admin-Key', KEY);
    expect(disabled.status).toBe(404);
  });
});

it('the rate limit comes from configuration', async () => {
  const app = createApp(configWith({ rateLimitPerMinute: 2 }));

  expect((await request(app).get('/api/info')).status).toBe(200);
  expect((await request(app).get('/api/info')).status).toBe(200);
  const limited = await request(app).get('/api/info');
  expect(limited.status).toBe(429);
  expectToMatchSpec(limited, 'get', '/api/info');
});

it('serves health, docs and the welcome route', async () => {
  const app = createApp(configWith());
  expect((await request(app).get('/health')).status).toBe(200);
  expect((await request(app).get('/ready')).status).toBe(200);
  expect((await request(app).get('/')).body.day).toBe(49);
});
