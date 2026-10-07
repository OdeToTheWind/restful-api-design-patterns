import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import {
  AppError,
  createApiRegistry,
  cursorPaginationQuery,
  decodeCursor,
  docsRouter,
  encodeCursor,
  envFields,
  generateOpenApiDocument,
  loadEnv,
  offsetPaginationQuery,
  paginateCursor,
  paginateOffset,
} from '../index';
import { createContractMatcher } from '../testing';

describe('pagination', () => {
  it('parses query defaults and limits', () => {
    expect(offsetPaginationQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(offsetPaginationQuery.parse({ page: '3', pageSize: '5' })).toEqual({ page: 3, pageSize: 5 });
    expect(offsetPaginationQuery.safeParse({ pageSize: '500' }).success).toBe(false);
    expect(cursorPaginationQuery.parse({})).toEqual({ limit: 20 });
  });

  it('paginateOffset computes skip/take and page metadata', async () => {
    const fetchPage = jest.fn().mockResolvedValue([['k', 'l'], 12]);

    const page = await paginateOffset({ page: 3, pageSize: 5 }, fetchPage);

    expect(fetchPage).toHaveBeenCalledWith({ skip: 10, take: 5 });
    expect(page.meta).toEqual({
      page: 3,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('paginateCursor fetches one extra row to detect the next page', async () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const fetchPage = jest.fn().mockResolvedValue(rows);

    const page = await paginateCursor({ limit: 2 }, fetchPage, (row) => row.id);

    expect(fetchPage).toHaveBeenCalledWith({ after: undefined, take: 3 });
    expect(page.items).toEqual(rows.slice(0, 2));
    expect(page.meta).toEqual({ limit: 2, hasNextPage: true, nextCursor: encodeCursor('b') });
  });

  it('paginateCursor decodes the cursor and ends with nextCursor null', async () => {
    const fetchPage = jest.fn().mockResolvedValue([{ id: 'c' }]);

    const page = await paginateCursor({ cursor: encodeCursor('b'), limit: 2 }, fetchPage, (row) => row.id);

    expect(fetchPage).toHaveBeenCalledWith({ after: 'b', take: 3 });
    expect(page.meta).toEqual({ limit: 2, hasNextPage: false, nextCursor: null });
  });

  it('rejects cursors it did not produce', () => {
    expect(decodeCursor(encodeCursor('row-42'))).toBe('row-42');
    expect(() => decodeCursor('not base64url!')).toThrow(AppError);
  });
});

describe('loadEnv', () => {
  const schema = z.object({
    PORT: envFields.port(3000),
    NODE_ENV: envFields.nodeEnv,
    JWT_SECRET: envFields.secret(16),
    CORS_ORIGIN: envFields.csv,
    FEATURE_X: envFields.flag,
  });

  it('coerces, applies defaults and parses lists and flags', () => {
    const env = loadEnv(schema, {
      JWT_SECRET: 'x'.repeat(16),
      CORS_ORIGIN: 'http://a.test, http://b.test',
      FEATURE_X: '1',
    });

    expect(env).toEqual({
      PORT: 3000,
      NODE_ENV: 'development',
      JWT_SECRET: 'x'.repeat(16),
      CORS_ORIGIN: ['http://a.test', 'http://b.test'],
      FEATURE_X: true,
    });
  });

  it('reports every problem at once', () => {
    expect(() => loadEnv(schema, { PORT: 'abc', NODE_ENV: 'staging', JWT_SECRET: 'short' })).toThrow(
      /PORT[\s\S]*NODE_ENV[\s\S]*JWT_SECRET: must be at least 16 characters/,
    );
  });

  it('treats a missing secret as an error rather than defaulting it', () => {
    expect(() => loadEnv(schema, {})).toThrow(/JWT_SECRET: Required/);
  });
});

describe('OpenAPI helpers', () => {
  const api = createApiRegistry();
  api.registry.registerPath({
    method: 'get',
    path: '/api/things',
    security: api.bearerSecurity,
    responses: { 200: api.success('Things', z.array(z.string())), 401: api.error('Not authenticated') },
  });
  const document = generateOpenApiDocument(api.registry, { title: 'Test API' });
  const app = express().use(docsRouter(document));

  it('generates an OpenAPI 3.1 document with the shared components', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.components?.schemas?.ErrorResponse).toBeDefined();
    expect(document.components?.securitySchemes?.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
    expect(document.paths?.['/api/things']?.get?.security).toEqual([{ bearerAuth: [] }]);
  });

  it('serves the JSON document and Swagger UI', async () => {
    const json = await request(app).get('/api/docs/openapi.json');
    expect(json.body.info.title).toBe('Test API');

    const ui = await request(app).get('/api/docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
  });
});

describe('createContractMatcher', () => {
  const api = createApiRegistry();
  const Thing = api.registry.register('Thing', z.object({ id: z.string(), name: z.string() }));
  api.registry.registerPath({
    method: 'get',
    path: '/things/{id}',
    responses: { 200: api.success('A thing', Thing), 404: api.error('Not found') },
  });
  const expectToMatchSpec = createContractMatcher(generateOpenApiDocument(api.registry, { title: 'T' }));
  const envelope = (data: unknown) => ({ success: true, message: 'ok', data, timestamp: new Date().toISOString() });

  it('accepts a documented response', () => {
    expect(() =>
      expectToMatchSpec({ status: 200, body: envelope({ id: '1', name: 'a' }) }, 'get', '/things/{id}'),
    ).not.toThrow();
  });

  it('rejects undocumented fields, statuses and operations', () => {
    expect(() =>
      expectToMatchSpec({ status: 200, body: envelope({ id: '1', name: 'a', secret: 'x' }) }, 'get', '/things/{id}'),
    ).toThrow(/does not match the spec/);
    expect(() => expectToMatchSpec({ status: 500, body: {} }, 'get', '/things/{id}')).toThrow(
      /undocumented status 500/,
    );
    expect(() => expectToMatchSpec({ status: 200, body: {} }, 'post', '/things/{id}')).toThrow(/not documented/);
  });
});
