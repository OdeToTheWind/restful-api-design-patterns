import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import {
  ApiResponse,
  AppError,
  asyncHandler,
  errorHandler,
  isAuthUser,
  logger,
  normalizeError,
  notFoundHandler,
  requestId,
  requestLogger,
  validateBody,
} from '../index';

const buildApp = () => {
  const app = express();
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: '1kb' }));

  app.get('/whoami', (req, res) => {
    ApiResponse.success(res, { requestId: req.id });
  });
  app.get('/ok', (_req, res) => {
    ApiResponse.success(res, { hello: 'world' }, 'Fetched');
  });
  app.get('/created', (_req, res) => {
    ApiResponse.success(res, { id: 1 }, 'Created', 201);
  });
  app.get('/app-error', () => {
    throw new AppError('Nope', 418, { field: 'x' });
  });
  app.get('/async-reject', asyncHandler(async () => {
    throw new AppError('Async failure', 422);
  }));
  app.get('/bug', asyncHandler(async () => {
    throw new Error('secret internal detail');
  }));
  app.post('/validate', validateBody(z.object({ name: z.string().min(2) })), (req, res) => {
    ApiResponse.success(res, req.body);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('ApiResponse', () => {
  it('wraps data in the success envelope', async () => {
    const res = await request(buildApp()).get('/ok');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Fetched', data: { hello: 'world' } });
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('honours a custom status code', async () => {
    const res = await request(buildApp()).get('/created');
    expect(res.status).toBe(201);
  });
});

describe('errorHandler', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('returns AppError status, message and details', async () => {
    const res = await request(buildApp()).get('/app-error');
    expect(res.status).toBe(418);
    expect(res.body).toMatchObject({ success: false, message: 'Nope', errors: { field: 'x' } });
  });

  it('catches rejected async handlers via asyncHandler', async () => {
    const res = await request(buildApp()).get('/async-reject');
    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Async failure');
  });

  it('hides internal error messages behind a generic 500', async () => {
    const res = await request(buildApp()).get('/bug');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(buildApp()).get('/missing');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, message: 'Route GET /missing not found' });
  });

  it('turns malformed JSON into a 400 instead of a 500', async () => {
    const res = await request(buildApp()).post('/validate').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies with 413', async () => {
    const res = await request(buildApp()).post('/validate').send({ name: 'x'.repeat(2000) });
    expect(res.status).toBe(413);
  });
});

describe('normalizeError', () => {
  it.each([
    [{ code: 'P2002' }, 409],
    [{ code: 'P2025' }, 404],
    [{ name: 'CastError' }, 400],
    [{ name: 'ValidationError', message: 'title is required' }, 400],
    ['a thrown string', 500],
  ])('maps %p to %i', (err, status) => {
    expect(normalizeError(err).statusCode).toBe(status);
  });
});

describe('validateBody', () => {
  it('returns field errors for invalid input', async () => {
    const res = await request(buildApp()).post('/validate').send({ name: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.name).toBeDefined();
  });

  it('strips unknown keys from the body', async () => {
    const res = await request(buildApp()).post('/validate').send({ name: 'Ada', role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ name: 'Ada' });
  });
});

describe('isAuthUser', () => {
  it('accepts a well-formed payload', () => {
    expect(isAuthUser({ id: '1', email: 'a@b.c', role: 'USER', iat: 1 })).toBe(true);
  });

  it.each([null, 'token', { id: 1, email: 'a@b.c', role: 'USER' }, { id: '1', email: 'a@b.c' }])(
    'rejects %p',
    (value) => {
      expect(isAuthUser(value)).toBe(false);
    },
  );
});

describe('requestId', () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('generates an id, exposes it as req.id and echoes it in X-Request-Id', async () => {
    const res = await request(buildApp()).get('/whoami');
    expect(res.headers['x-request-id']).toMatch(UUID);
    expect(res.body.data.requestId).toBe(res.headers['x-request-id']);
  });

  it('reuses a safe incoming X-Request-Id (e.g. from a gateway)', async () => {
    const res = await request(buildApp()).get('/whoami').set('X-Request-Id', 'gateway-abc_123');
    expect(res.headers['x-request-id']).toBe('gateway-abc_123');
  });

  it.each(['has spaces', 'x'.repeat(65), '<script>'])('replaces unsafe incoming id %p', async (unsafe) => {
    const res = await request(buildApp()).get('/whoami').set('X-Request-Id', unsafe);
    expect(res.headers['x-request-id']).toMatch(UUID);
  });
});

describe('logging', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs one line per request with status, duration and request id', async () => {
    const log = jest.spyOn(logger, 'log');

    const res = await request(buildApp()).get('/missing');

    expect(log).toHaveBeenCalledWith(
      'warn',
      'GET /missing 404',
      expect.objectContaining({ status: 404, requestId: res.headers['x-request-id'], durationMs: expect.any(Number) }),
    );
  });

  it('logs unexpected errors with the request id instead of using console.error', async () => {
    const error = jest.spyOn(logger, 'error');
    const consoleError = jest.spyOn(console, 'error');

    const res = await request(buildApp()).get('/bug');

    expect(error).toHaveBeenCalledWith(
      'Unhandled error on GET /bug',
      expect.objectContaining({ requestId: res.headers['x-request-id'], error: expect.any(Error) }),
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('does not log expected (4xx) errors as unhandled', async () => {
    const error = jest.spyOn(logger, 'error');
    await request(buildApp()).get('/app-error');
    expect(error).not.toHaveBeenCalled();
  });
});
