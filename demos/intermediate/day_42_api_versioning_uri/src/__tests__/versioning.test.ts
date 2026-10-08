import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import type { AppConfig } from '../config';
import { v1Document } from '../v1/v1.docs';
import { v2Document } from '../v2/v2.docs';

const config: AppConfig = {
  port: 0,
  corsOrigins: [],
  v1: { deprecatedAt: new Date('2026-10-01T00:00:00Z'), sunsetAt: new Date('2027-04-01T00:00:00Z') },
};
const beforeSunset = () => new Date('2026-12-01T00:00:00Z');
const afterSunset = () => new Date('2027-05-01T00:00:00Z');
const app = createApp(config, beforeSunset);
const matchesV1 = createContractMatcher(v1Document);
const matchesV2 = createContractMatcher(v2Document);

describe('v1 (deprecated)', () => {
  it('still works, and every response announces deprecation, sunset and the successor', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.headers.deprecation).toBe(`@${Date.parse('2026-10-01T00:00:00Z') / 1000}`);
    expect(res.headers.sunset).toBe('Thu, 01 Apr 2027 00:00:00 GMT');
    expect(res.headers.link).toContain('</api/v2/products>; rel="successor-version"');
    expect(res.body.data[0]).toEqual({ id: 'p-1', name: 'RESTful Web APIs (book)', priceCents: 3999, currency: 'USD' });
    matchesV1(res, 'get', '/api/v1/products');
  });

  it('answers 410 Gone after the sunset date', async () => {
    const retired = createApp(config, afterSunset);
    const res = await request(retired).get('/api/v1/products/p-1');

    expect(res.status).toBe(410);
    expect(res.headers.sunset).toBeDefined();
    matchesV1(res, 'get', '/api/v1/products/{id}');
  });

  it('single products, 404 and invalid ids', async () => {
    matchesV1(await request(app).get('/api/v1/products/p-2'), 'get', '/api/v1/products/{id}');
    matchesV1(await request(app).get('/api/v1/products/p-99'), 'get', '/api/v1/products/{id}');
    expect((await request(app).get('/api/v1/products/DROP')).status).toBe(400);
  });
});

describe('v2 (current)', () => {
  it('uses the new price object, exposes tags, and has no deprecation headers', async () => {
    const res = await request(app).get('/api/v2/products/p-1');

    expect(res.body.data).toEqual({
      id: 'p-1',
      name: 'RESTful Web APIs (book)',
      price: { amount: '39.99', currency: 'USD' },
      tags: ['books', 'rest'],
    });
    expect(res.headers.deprecation).toBeUndefined();
    matchesV2(res, 'get', '/api/v2/products/{id}');
  });

  it('paginates and filters lists', async () => {
    const res = await request(app).get('/api/v2/products?tag=books&pageSize=2');

    expect(res.body.data.items.map((p: { id: string }) => p.id)).toEqual(['p-1', 'p-3']);
    expect(res.body.data.meta).toMatchObject({ page: 1, pageSize: 2, totalItems: 3, totalPages: 2, hasNextPage: true });
    matchesV2(res, 'get', '/api/v2/products');
    expect((await request(app).get('/api/v2/products?pageSize=1000')).status).toBe(400);
    matchesV2(await request(app).get('/api/v2/products/p-99'), 'get', '/api/v2/products/{id}');
  });

  it('is unaffected by the v1 sunset', async () => {
    expect((await request(createApp(config, afterSunset)).get('/api/v2/products')).status).toBe(200);
  });
});

describe('discovery and docs', () => {
  it('lists versions with their status, which changes at the sunset date', async () => {
    const before = await request(app).get('/api/versions');
    const after = await request(createApp(config, afterSunset)).get('/api/versions');
    expect(before.body.data.map((v: { status: string }) => v.status)).toEqual(['deprecated', 'current']);
    expect(after.body.data[0].status).toBe('retired');
  });

  it('serves a separate OpenAPI document per version', async () => {
    const v1 = await request(app).get('/api/v1/docs/openapi.json');
    const v2 = await request(app).get('/api/v2/docs/openapi.json');
    expect(Object.keys(v1.body.paths)).toEqual(['/api/v1/products', '/api/v1/products/{id}']);
    expect(v1.body.paths['/api/v1/products'].get.deprecated).toBe(true);
    expect(Object.keys(v2.body.paths)).toEqual(['/api/v2/products', '/api/v2/products/{id}']);

    const v1Ui = await request(app).get('/api/v1/docs/');
    const v2Ui = await request(app).get('/api/v2/docs/');
    expect(v1Ui.status).toBe(200);
    expect(v2Ui.status).toBe(200);
  });

  it('unversioned paths do not exist', async () => {
    expect((await request(app).get('/api/products')).status).toBe(404);
    expect((await request(app).get('/health')).status).toBe(200);
  });
});
