import request from 'supertest';
import app from '../app';

describe('Day 30 — global error middleware', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('passes successful responses through untouched', async () => {
    const res = await request(app).get('/api/test/success');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { message: 'Everything is working fine!' } });
  });

  it.each([
    ['/api/test/bad-request', 400, 'Invalid input data'],
    ['/api/test/not-found', 404, 'Resource not found'],
  ])('turns AppError thrown in %s into %i', async (path, status, message) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(status);
    expect(res.body).toMatchObject({ success: false, message });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const res = await request(app).get('/api/test/server-error');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(JSON.stringify(res.body)).not.toContain('crash simulation');
  });

  it('answers unknown routes with a JSON 404 (not the Express HTML page)', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.message).toBe('Route GET /api/does-not-exist not found');
  });

  it('still serves the welcome route registered after the API routes', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.day).toBe(30);
  });
});

describe('request context', () => {
  it('tags every response, including errors, with an X-Request-Id', async () => {
    const res = await request(app).get('/api/test/server-error');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('sets security headers via helmet', async () => {
    expect((await request(app).get('/')).headers['x-content-type-options']).toBe('nosniff');
  });
});
