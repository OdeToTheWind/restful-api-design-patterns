import express from 'express';
import request from 'supertest';
import Transport from 'winston-transport';
import {
  addToLogContext,
  ApiResponse,
  getLogContext,
  logger,
  redact,
  REDACTED,
  requestId,
  requestLogger,
} from '../index';

/** Collects what the logger would write, after all formats (context + redaction) ran */
class CaptureTransport extends Transport {
  entries: Record<string, unknown>[] = [];
  log(info: Record<string, unknown>, callback: () => void) {
    this.entries.push(info);
    callback();
  }
}

let capture: CaptureTransport;
beforeEach(() => {
  capture = new CaptureTransport();
  logger.add(capture);
  logger.silent = false;
  logger.transports.forEach((t) => (t.silent = t !== capture));
});
afterEach(() => {
  logger.remove(capture);
  logger.silent = true;
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

// A "service" that logs without being given any request information
const chargeCard = async (amount: number) => {
  await tick();
  logger.info('charging card', { amount, cardToken: 'tok_live_123' });
};

const app = express()
  .use(requestId)
  .use(requestLogger)
  .get('/orders/:id', async (req, res) => {
    addToLogContext({ userId: 'user-42' });
    await chargeCard(1999);
    await tick();
    ApiResponse.success(res, { id: req.params.id });
  });

it('logs from deep inside a request carry its requestId and userId automatically', async () => {
  const res = await request(app).get('/orders/7').set('X-Request-Id', 'req-abc');

  const charge = capture.entries.find((e) => e.message === 'charging card');
  expect(charge).toMatchObject({ requestId: 'req-abc', userId: 'user-42', amount: 1999 });
  expect(res.headers['x-request-id']).toBe('req-abc');
});

it('the request log line records the route pattern rather than the raw URL', async () => {
  await request(app).get('/orders/7');
  const line = capture.entries.find((e) => typeof e.message === 'string' && e.message.startsWith('GET /orders/7'));
  expect(line).toMatchObject({ route: '/orders/:id', status: 200 });
});

it('concurrent requests never see each other’s context', async () => {
  await Promise.all(['a', 'b', 'c'].map((id) => request(app).get(`/orders/${id}`).set('X-Request-Id', `req-${id}`)));
  const ids = capture.entries.filter((e) => e.message === 'charging card').map((e) => e.requestId);
  expect(ids.sort()).toEqual(['req-a', 'req-b', 'req-c']);
});

it('redacts secrets before they are written, at any depth', async () => {
  await request(app).get('/orders/1');
  logger.info('login attempt', {
    email: 'ada@example.com',
    password: 'hunter2',
    headers: { authorization: 'Bearer abc', cookie: 'sid=1', accept: 'json' },
    payload: [{ refreshToken: 'r1', apiKey: 'k1', note: 'ok' }],
  });

  const charge = capture.entries.find((e) => e.message === 'charging card');
  const login = capture.entries.find((e) => e.message === 'login attempt');
  expect(charge?.cardToken).toBe(REDACTED);
  expect(login).toMatchObject({
    email: 'ada@example.com',
    password: REDACTED,
    headers: { authorization: REDACTED, cookie: REDACTED, accept: 'json' },
    payload: [{ refreshToken: REDACTED, apiKey: REDACTED, note: 'ok' }],
  });
  expect(JSON.stringify(capture.entries)).not.toMatch(/hunter2|tok_live|Bearer abc/);
});

it('outside a request there is no context, and explicit fields always win', () => {
  expect(getLogContext()).toEqual({});
  logger.info('background job', { requestId: 'job-1' });
  expect(capture.entries.at(-1)).toMatchObject({ requestId: 'job-1' });
});

it('redact() leaves non-objects, dates and errors alone', () => {
  const error = new Error('boom');
  const date = new Date(0);
  expect(redact('text')).toBe('text');
  expect(redact({ error, date })).toEqual({ error, date });
});
