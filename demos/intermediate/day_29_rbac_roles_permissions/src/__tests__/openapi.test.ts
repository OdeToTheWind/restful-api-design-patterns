import request from 'supertest';
import app from '../app';

jest.mock('../lib/prisma', () => ({ __esModule: true, default: {} }));

describe('API documentation', () => {
  it('serves an OpenAPI 3.1 document covering every endpoint', async () => {
    const res = await request(app).get('/api/docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(Object.keys(res.body.paths).sort()).toEqual([
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/auth/refresh',
      '/api/auth/register',
      '/api/users',
      '/api/users/admin',
    ]);
  });

  it('documents the register body from the Zod schema — and role is not in it', async () => {
    const res = await request(app).get('/api/docs/openapi.json');
    const body = res.body.paths['/api/auth/register'].post.requestBody.content['application/json'].schema;

    expect(Object.keys(body.properties).sort()).toEqual(['email', 'name', 'password']);
    expect(body.properties.password).toMatchObject({ minLength: 8, maxLength: 72 });
  });

  it('marks protected endpoints with bearer auth', async () => {
    const { body } = await request(app).get('/api/docs/openapi.json');

    expect(body.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
    expect(body.paths['/api/users/admin'].get.security).toEqual([{ bearerAuth: [] }]);
    expect(body.paths['/api/auth/login'].post.security).toBeUndefined();
  });

  it('serves Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
