import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { openApiDocument } from '../docs/openapi';
import { MAX_ATTEMPTS } from '../services/transfer.service';
import { Prisma } from '../../generated/prisma';

jest.mock('../lib/prisma', () => {
  const client = {
    account: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transfer: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
  client.$transaction.mockImplementation((fn: (tx: typeof client) => unknown) => fn(client));
  return { __esModule: true, default: client };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const A = 'clx0000000000000000000001';
const B = 'clx0000000000000000000002';
const now = new Date();
const account = (version = 0, owner = 'Ada') => ({
  id: A,
  owner,
  balanceCents: 10_000,
  version,
  createdAt: now,
  updatedAt: now,
});
const transferRow = (key: string | null = null) => ({
  id: 't1',
  idempotencyKey: key,
  fromId: A,
  toId: B,
  amountCents: 2_500,
  createdAt: now,
});
const known = (code: string) => new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: '5' });
const db = jest.mocked(prisma);
const send = (body = { fromId: A, toId: B, amountCents: 2_500 }, key?: string) => {
  const req = request(app).post('/api/transfers');
  return (key ? req.set('Idempotency-Key', key) : req).send(body);
};

beforeEach(() => {
  jest.clearAllMocks();
  db.$transaction.mockImplementation(((fn: (tx: typeof db) => unknown) => fn(db)) as never);
  db.account.updateMany.mockResolvedValue({ count: 1 });
  db.transfer.findUnique.mockResolvedValue(null);
  db.transfer.create.mockResolvedValue(transferRow());
});

describe('transfers', () => {
  it('debits conditionally, credits and records — inside one SERIALIZABLE transaction', async () => {
    const res = await send();

    expect(res.status).toBe(201);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(db.account.updateMany).toHaveBeenCalledWith({
      where: { id: A, balanceCents: { gte: 2_500 } },
      data: { balanceCents: { decrement: 2_500 }, version: { increment: 1 } },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: B },
      data: { balanceCents: { increment: 2_500 }, version: { increment: 1 } },
    });
    expectToMatchSpec(res, 'post', '/api/transfers');
  });

  it('insufficient funds is 409 and nothing else happens', async () => {
    db.account.updateMany.mockResolvedValueOnce({ count: 0 });
    db.account.findUnique.mockResolvedValueOnce({ id: A } as never);

    const res = await send();

    expect(res.status).toBe(409);
    expect(db.account.update).not.toHaveBeenCalled();
    expect(db.transfer.create).not.toHaveBeenCalled();
    expectToMatchSpec(res, 'post', '/api/transfers');
  });

  it('a missing destination aborts the transaction (404) — the debit is rolled back with it', async () => {
    db.account.update.mockRejectedValueOnce(known('P2025'));
    const res = await send();
    expect(res.status).toBe(404);
    expect(db.transfer.create).not.toHaveBeenCalled();
  });

  it('retries the whole transaction after a serialization conflict (P2034)', async () => {
    db.$transaction.mockRejectedValueOnce(known('P2034'));
    const res = await send();
    expect(res.status).toBe(201);
    expect(db.$transaction).toHaveBeenCalledTimes(2);
  });

  it('after repeated conflicts it answers 503 + Retry-After (retryable), not 500', async () => {
    db.$transaction.mockRejectedValue(known('P2034'));
    const res = await send();
    expect([res.status, res.headers['retry-after']]).toEqual([503, '1']);
    expect(db.$transaction).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expectToMatchSpec(res, 'post', '/api/transfers');
  });

  it('replays a transfer with the same Idempotency-Key instead of moving money again', async () => {
    db.transfer.findUnique.mockResolvedValueOnce(transferRow('pay-rent-2026-10'));

    const res = await send(undefined, 'pay-rent-2026-10');

    expect(res.status).toBe(200);
    expect(res.headers['idempotent-replayed']).toBe('true');
    expect(db.account.updateMany).not.toHaveBeenCalled();
    expectToMatchSpec(res, 'post', '/api/transfers');
  });

  it('refuses to reuse a key for a different transfer (422)', async () => {
    db.transfer.findUnique.mockResolvedValueOnce(transferRow('pay-rent-2026-10'));
    const res = await send({ fromId: A, toId: B, amountCents: 99 }, 'pay-rent-2026-10');
    expect(res.status).toBe(422);
  });

  it('two simultaneous first uses of a key: the loser returns the winner’s transfer', async () => {
    db.$transaction.mockRejectedValueOnce(known('P2002'));
    db.transfer.findUnique.mockResolvedValueOnce(transferRow('race-key-0001'));
    const res = await send(undefined, 'race-key-0001');
    expect([res.status, res.body.data.idempotencyKey]).toEqual([200, 'race-key-0001']);
  });

  it('rejects transfers to the same account and bad keys', async () => {
    expect((await send({ fromId: A, toId: A, amountCents: 1 })).status).toBe(400);
    expect((await send(undefined, 'bad key')).status).toBe(400);
  });

  it('lists transfers for an account', async () => {
    db.transfer.findMany.mockResolvedValue([transferRow()]);
    expectToMatchSpec(await request(app).get(`/api/transfers?accountId=${A}`), 'get', '/api/transfers');
    expect(db.transfer.findMany.mock.calls[0][0]).toMatchObject({ where: { OR: [{ fromId: A }, { toId: A }] } });
  });
});

describe('optimistic locking (ETag / If-Match)', () => {
  it('reads return the version as ETag, and If-None-Match gives 304', async () => {
    db.account.findUniqueOrThrow.mockResolvedValue(account(3));
    const res = await request(app).get(`/api/accounts/${A}`);
    expect(res.headers.etag).toBe('"3"');
    expectToMatchSpec(res, 'get', `/api/accounts/{id}`);
    expect((await request(app).get(`/api/accounts/${A}`).set('If-None-Match', '"3"')).status).toBe(304);
  });

  it('updates only when If-Match matches the current version', async () => {
    db.account.findUniqueOrThrow.mockResolvedValue(account(4, 'Ada L.'));
    const res = await request(app).patch(`/api/accounts/${A}`).set('If-Match', '"3"').send({ owner: 'Ada L.' });

    expect(db.account.updateMany).toHaveBeenCalledWith({
      where: { id: A, version: 3 },
      data: { owner: 'Ada L.', version: { increment: 1 } },
    });
    expect(res.headers.etag).toBe('"4"');
    expectToMatchSpec(res, 'patch', '/api/accounts/{id}');
  });

  it('a stale ETag is 412 (no lost update), a missing one 428', async () => {
    db.account.updateMany.mockResolvedValueOnce({ count: 0 });
    db.account.findUnique.mockResolvedValueOnce({ version: 5 } as never);
    const stale = await request(app).patch(`/api/accounts/${A}`).set('If-Match', '"3"').send({ owner: 'X' });
    expect([stale.status, stale.headers.etag]).toEqual([412, '"5"']);
    expectToMatchSpec(stale, 'patch', '/api/accounts/{id}');

    expectToMatchSpec(
      await request(app).patch(`/api/accounts/${A}`).send({ owner: 'X' }),
      'patch',
      '/api/accounts/{id}',
    );
    expect((await request(app).patch(`/api/accounts/${A}`).set('If-Match', 'W/"3"').send({ owner: 'X' })).status).toBe(
      428,
    );
  });

  it('creating an account returns its first ETag', async () => {
    db.account.create.mockResolvedValue(account(0));
    const res = await request(app).post('/api/accounts').send({ owner: 'Ada', initialBalanceCents: 10_000 });
    expect(res.headers.etag).toBe('"0"');
    expectToMatchSpec(res, 'post', '/api/accounts');
  });
});
