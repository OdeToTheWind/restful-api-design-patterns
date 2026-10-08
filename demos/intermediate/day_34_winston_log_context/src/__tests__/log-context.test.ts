import request from 'supertest';
import jwt from 'jsonwebtoken';
import { logger, REDACTED } from '@restful/shared';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import type { AppConfig } from '../config';
import { openApiDocument } from '../docs/openapi';
import { RecentLogsTransport } from '../lib/recent-logs';

const expectToMatchSpec = createContractMatcher(openApiDocument);
const SECRET = 'test-only-secret-at-least-32-characters-long';
const config: AppConfig = {
  port: 0,
  nodeEnv: 'development',
  logLevel: 'debug',
  jwtSecret: SECRET,
  corsOrigins: [],
  exposeRecentLogs: true,
};
const bearer = (id = 'user-7') => `Bearer ${jwt.sign({ id, email: `${id}@example.com`, role: 'USER' }, SECRET)}`;

let recent: RecentLogsTransport;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  recent = new RecentLogsTransport();
  logger.add(recent);
  logger.silent = false;
  logger.transports.forEach((t) => (t.silent = t !== recent)); // keep the console quiet
  app = createApp(config, undefined, recent);
});
afterEach(() => {
  logger.remove(recent);
  logger.silent = true;
});

const placeOrder = (cardToken = 'tok_live_4242', auth = bearer()) =>
  request(app)
    .post('/api/orders')
    .set('Authorization', auth)
    .set('X-Request-Id', 'req-34')
    .send({ items: [{ sku: 'book-rest', quantity: 2 }], cardToken });

it('service logs carry requestId, userId and component without being passed them', async () => {
  const res = await placeOrder();
  expect(res.status).toBe(201);
  expectToMatchSpec(res, 'post', '/api/orders');

  const serviceLines = recent.list({ requestId: 'req-34' }).filter((e) => e.component === 'order-service');
  expect(serviceLines.map((e) => e.message)).toEqual(['validating items', 'charging card', 'order placed']);
  for (const line of serviceLines) expect(line).toMatchObject({ requestId: 'req-34', userId: 'user-7' });
});

it('the card token never reaches the logs', async () => {
  await placeOrder('tok_live_4242');

  const charging = recent.list().find((e) => e.message === 'charging card');
  expect(charging?.cardToken).toBe(REDACTED);
  expect(JSON.stringify(recent.list())).not.toContain('tok_live_4242');
});

it('a declined payment is logged as a warning with full context and answered with 402', async () => {
  const res = await placeOrder('tok_declined_0001');

  expect(res.status).toBe(402);
  expectToMatchSpec(res, 'post', '/api/orders');
  expect(recent.list().find((e) => e.message === 'payment declined')).toMatchObject({
    level: expect.stringContaining('warn'),
    requestId: 'req-34',
    userId: 'user-7',
  });
});

it('the request log line names the route pattern and the user', async () => {
  const { body } = await placeOrder();
  await request(app).get(`/api/orders/${body.data.id}`).set('Authorization', bearer()).set('X-Request-Id', 'req-get');

  const line = recent.list({ requestId: 'req-get' }).find((e) => String(e.message).startsWith('GET '));
  expect(line).toMatchObject({ route: '/api/orders/:id', userId: 'user-7', status: 200 });
});

it('/api/debug/logs filters by requestId and is not mounted when disabled', async () => {
  await placeOrder();
  const res = await request(app).get('/api/debug/logs?requestId=req-34');
  expect(res.body.data.length).toBeGreaterThan(0);
  expect(res.body.data.every((e: { requestId: string }) => e.requestId === 'req-34')).toBe(true);
  expectToMatchSpec(res, 'get', '/api/debug/logs');

  const production = createApp({ ...config, nodeEnv: 'production', logLevel: 'info', exposeRecentLogs: false });
  expect((await request(production).get('/api/debug/logs')).status).toBe(404);
});

it('applies the configured level: debug lines disappear at info', async () => {
  createApp({ ...config, logLevel: 'info' }, undefined, recent);
  logger.debug('detail');
  logger.info('summary');
  expect(recent.list().map((e) => e.message)).toEqual(['summary']);
});

it('orders are private to their owner; bad input and missing auth are rejected', async () => {
  const { body } = await placeOrder();
  expectToMatchSpec(
    await request(app).get(`/api/orders/${body.data.id}`).set('Authorization', bearer('someone-else')),
    'get',
    '/api/orders/{id}',
  );
  expect((await placeOrder('tok', 'Bearer nope')).status).toBe(401);
  const unknown = await request(app)
    .post('/api/orders')
    .set('Authorization', bearer())
    .send({ items: [{ sku: 'X', quantity: 1 }], cardToken: 't' });
  expect(unknown.status).toBe(400);
  expect((await request(app).get('/health')).status).toBe(200);
});
