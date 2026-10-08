import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import { openApiDocument } from '../docs/openapi';
import { InMemoryInventory, InMemoryOrderRepository, LogMailer, SandboxPaymentGateway } from '../adapters/in-memory';
import { CheckoutService } from '../checkout/checkout.service';

// End to end over HTTP with the same fakes the demo app runs on
const expectToMatchSpec = createContractMatcher(openApiDocument);
const app = createApp(
  new CheckoutService({
    payments: new SandboxPaymentGateway(),
    inventory: new InMemoryInventory(new Map([['BOOK-REST', 3]])),
    orders: new InMemoryOrderRepository(),
    mailer: new LogMailer(),
    clock: { now: () => new Date('2026-10-08T09:00:00Z') },
  }),
);
const body = (cardToken = 'tok_ok', quantity = 1) => ({
  email: 'a@b.co',
  items: [{ sku: 'book-rest', quantity }],
  cardToken,
});

it('checks out, then reads the order back', async () => {
  const created = await request(app).post('/api/checkout').send(body());
  expect(created.status).toBe(201);
  expectToMatchSpec(created, 'post', '/api/checkout');
  expectToMatchSpec(await request(app).get(`/api/orders/${created.body.data.id}`), 'get', '/api/orders/{id}');
});

it('maps declined payments, missing stock, bad input and unknown orders', async () => {
  expectToMatchSpec(await request(app).post('/api/checkout').send(body('tok_declined')), 'post', '/api/checkout');
  expectToMatchSpec(await request(app).post('/api/checkout').send(body('tok_ok', 9)), 'post', '/api/checkout');
  expectToMatchSpec(await request(app).post('/api/checkout').send({ email: 'x' }), 'post', '/api/checkout');
  expectToMatchSpec(
    await request(app)
      .post('/api/checkout')
      .send({ ...body(), items: [{ sku: 'NOPE', quantity: 1 }] }),
    'post',
    '/api/checkout',
  );
  expectToMatchSpec(
    await request(app).get('/api/orders/00000000-0000-4000-8000-000000000000'),
    'get',
    '/api/orders/{id}',
  );
  expect((await request(app).get('/health')).status).toBe(200);
});
