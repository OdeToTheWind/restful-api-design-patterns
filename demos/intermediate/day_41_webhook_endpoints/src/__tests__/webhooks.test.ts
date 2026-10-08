import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';
import { SIGNATURE_HEADER, signatureHeader } from '../webhooks/signature';

jest.mock('../lib/prisma', () => {
  const client = {
    order: { create: jest.fn(), findUniqueOrThrow: jest.fn(), updateMany: jest.fn() },
    webhookEvent: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const SECRET = 'whsec_test_only_secret_at_least_32_chars';
const ORDER = 'clx0000000000000000000001';
const event = (type = 'payment.succeeded', id = 'evt_001') =>
  JSON.stringify({ id, type, data: { orderId: ORDER, amountCents: 4999 } });
const deliver = (body: string, header = signatureHeader(SECRET, body)) =>
  request(app)
    .post('/api/webhooks/payments')
    .set('Content-Type', 'application/json')
    .set(SIGNATURE_HEADER, header)
    .send(body);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
});

it('a signed payment.succeeded records the event and marks a PENDING order PAID, atomically', async () => {
  const res = await deliver(event());

  expect(res.status).toBe(200);
  expect(res.body.data).toEqual({ eventId: 'evt_001', status: 'processed' });
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ eventId: 'evt_001', type: 'payment.succeeded' }),
  });
  expect(prisma.order.updateMany).toHaveBeenCalledWith({
    where: { id: ORDER, status: 'PENDING' },
    data: { status: 'PAID' },
  });
  expectToMatchSpec(res, 'post', '/api/webhooks/payments');
});

it('payment.failed moves a PENDING order to FAILED', async () => {
  await deliver(event('payment.failed', 'evt_002'));
  expect(prisma.order.updateMany).toHaveBeenCalledWith({
    where: { id: ORDER, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
});

it('a redelivered event is acknowledged without being applied twice', async () => {
  jest
    .mocked(prisma.webhookEvent.create)
    .mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }) as never,
    );

  const res = await deliver(event());

  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('duplicate');
  expect(prisma.order.updateMany).not.toHaveBeenCalled();
});

it.each([
  ['no signature', ''],
  ['a forged signature', `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`],
  ['a replayed (stale) signature', signatureHeader(SECRET, event(), Math.floor(Date.now() / 1000) - 3600)],
])('rejects %s with 401 and stores nothing', async (_case, header) => {
  const req = request(app).post('/api/webhooks/payments').set('Content-Type', 'application/json');
  const res = await (header ? req.set(SIGNATURE_HEADER, header) : req).send(event());

  expect(res.status).toBe(401);
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expectToMatchSpec(res, 'post', '/api/webhooks/payments');
});

it('verifies the exact bytes received: re-formatted JSON with the original signature fails', async () => {
  const original = event();
  const reformatted = JSON.stringify(JSON.parse(original), null, 2);
  const res = await deliver(reformatted, signatureHeader(SECRET, original));
  expect(res.status).toBe(401);
});

it('acknowledges unknown event types without acting on them (so the provider stops retrying)', async () => {
  const res = await deliver(JSON.stringify({ id: 'evt_x', type: 'customer.created', data: {} }));
  expect(res.body.data).toEqual({ eventId: 'evt_x', status: 'ignored' });
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it('signed but malformed events are 400', async () => {
  expect((await deliver('not json')).status).toBe(400);
  expect((await deliver(JSON.stringify({ type: 'payment.succeeded' }))).status).toBe(400);
  expect(
    (await deliver(JSON.stringify({ id: 'e', type: 'payment.succeeded', data: { orderId: 'nope' } }))).body.data.status,
  ).toBe('ignored');
});

it('orders and the event log', async () => {
  const now = new Date();
  jest
    .mocked(prisma.order.create)
    .mockResolvedValue({ id: ORDER, amountCents: 4999, status: 'PENDING', createdAt: now, updatedAt: now });
  expectToMatchSpec(await request(app).post('/api/orders').send({ amountCents: 4999 }), 'post', '/api/orders');

  jest
    .mocked(prisma.order.findUniqueOrThrow)
    .mockResolvedValue({ id: ORDER, amountCents: 4999, status: 'PAID', createdAt: now, updatedAt: now });
  expectToMatchSpec(await request(app).get(`/api/orders/${ORDER}`), 'get', '/api/orders/{id}');

  jest
    .mocked(prisma.webhookEvent.findMany)
    .mockResolvedValue([{ id: 'w1', eventId: 'evt_001', type: 'payment.succeeded', payload: {}, receivedAt: now }]);
  expectToMatchSpec(await request(app).get('/api/webhooks/events'), 'get', '/api/webhooks/events');
});
