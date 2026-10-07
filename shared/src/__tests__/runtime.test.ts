import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { ApiResponse, errorHandler, healthRouter, startServer, validateParams, validateQuery } from '../index';

describe('validateQuery / validateParams', () => {
  const app = express();
  app.get(
    '/items/:id',
    validateParams(z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) })),
    validateQuery(z.object({ limit: z.coerce.number().int().min(1).max(100).default(10) })),
    (req, res) => {
      ApiResponse.success(res, { id: req.params.id, query: req.query });
    },
  );
  app.use(errorHandler);

  const validId = 'a'.repeat(24);

  it('passes valid params and coerces/defaults the query', async () => {
    const res = await request(app).get(`/items/${validId}?limit=25&extra=x`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: validId, query: { limit: 25 } });

    const defaults = await request(app).get(`/items/${validId}`);
    expect(defaults.body.data.query).toEqual({ limit: 10 });
  });

  it('rejects malformed params with 400 field errors', async () => {
    const res = await request(app).get('/items/not-an-id');
    expect(res.status).toBe(400);
    expect(res.body.errors.id).toBeDefined();
  });

  it('rejects an out-of-range query value with 400', async () => {
    const res = await request(app).get(`/items/${validId}?limit=1000`);
    expect(res.status).toBe(400);
    expect(res.body.errors.limit).toBeDefined();
  });
});

describe('healthRouter', () => {
  const build = (checks: Parameters<typeof healthRouter>[0], timeoutMs?: number) =>
    express().use(healthRouter(checks, timeoutMs));

  it('GET /health reports liveness without running checks', async () => {
    const check = jest.fn().mockRejectedValue(new Error('db down'));
    const res = await request(build({ database: check })).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(check).not.toHaveBeenCalled();
  });

  it('GET /ready is 200 when every check passes', async () => {
    const res = await request(build({ database: async () => 'pong' })).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ready', checks: { database: 'up' } });
  });

  it('GET /ready is 503 and names the failing dependency', async () => {
    const res = await request(
      build({ database: async () => Promise.reject(new Error('refused')), cache: async () => 1 }),
    ).get('/ready');

    expect(res.status).toBe(503);
    expect(res.body.errors).toEqual({ database: 'down', cache: 'up' });
  });

  it('treats a hanging check as down after the timeout', async () => {
    const res = await request(build({ database: () => new Promise(() => undefined) }, 20)).get('/ready');
    expect(res.status).toBe(503);
  });
});

describe('startServer', () => {
  afterEach(() => {
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
  });

  const app = () => express().get('/', (_req, res) => res.send('ok'));

  it('serves requests, then on shutdown closes the server before running hooks and exits 0', async () => {
    const events: string[] = [];
    const exit = jest.fn((code: number) => events.push(`exit:${code}`));
    const { server, shutdown } = startServer(app(), {
      port: 0,
      name: 'test',
      exit,
      onShutdown: [async () => events.push(server.listening ? 'hook:server-open' : 'hook:server-closed')],
    });
    await new Promise((resolve) => server.once('listening', resolve));

    expect((await request(server).get('/')).text).toBe('ok');
    await shutdown('test');

    expect(events).toEqual(['hook:server-closed', 'exit:0']);
  });

  it('is idempotent — a second signal does not run hooks or exit twice', async () => {
    const hook = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();
    const { server, shutdown } = startServer(app(), { port: 0, name: 'test', exit, onShutdown: [hook] });
    await new Promise((resolve) => server.once('listening', resolve));

    await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')]);

    expect(hook).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('exits 1 when a shutdown hook fails', async () => {
    const exit = jest.fn();
    const { server, shutdown } = startServer(app(), {
      port: 0,
      name: 'test',
      exit,
      onShutdown: [async () => Promise.reject(new Error('disconnect failed'))],
    });
    await new Promise((resolve) => server.once('listening', resolve));

    await shutdown('test');

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('forces exit 1 when shutdown hangs past the timeout', async () => {
    const exit = jest.fn();
    const { server, shutdown } = startServer(app(), {
      port: 0,
      name: 'test',
      exit,
      shutdownTimeoutMs: 20,
      onShutdown: [() => new Promise(() => undefined)],
    });
    await new Promise((resolve) => server.once('listening', resolve));

    void shutdown('test');
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('installs SIGTERM and SIGINT handlers', async () => {
    const { server, shutdown } = startServer(app(), { port: 0, name: 'test', exit: jest.fn() });
    await new Promise((resolve) => server.once('listening', resolve));

    expect(process.listenerCount('SIGTERM')).toBe(1);
    expect(process.listenerCount('SIGINT')).toBe(1);
    await shutdown('test');
  });
});
