import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';
import { openApiDocument } from '../contract/books.contract';
import { SPEC_PATH, renderSpec } from '../contract/artifacts';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    book: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date();
const book = {
  id: ID,
  title: 'T',
  author: 'A',
  isbn: '9780134685991',
  publishedYear: null,
  createdAt: now,
  updatedAt: now,
};

describe('generated artifacts are committed and up to date', () => {
  it('openapi.json matches the contract (run `pnpm openapi:generate` after changing it)', () => {
    expect(readFileSync(SPEC_PATH, 'utf8')).toBe(renderSpec());
  });

  it('the typed client matches openapi.json (same check as `pnpm openapi:check`)', () => {
    const tsNode = require.resolve('ts-node/dist/bin.js');
    const run = () =>
      execFileSync(process.execPath, [tsNode, 'src/contract/generate.ts', '--check'], {
        cwd: join(__dirname, '..', '..'),
        stdio: 'pipe',
      });
    expect(run).not.toThrow();
  }, 60_000);
});

describe('responses match the contract', () => {
  it('every Books operation, including error responses', async () => {
    jest.mocked(prisma.book.findMany).mockResolvedValue([book]);
    expectToMatchSpec(await request(app).get('/api/books'), 'get', '/api/books');

    jest.mocked(prisma.book.create).mockResolvedValue(book);
    expectToMatchSpec(
      await request(app).post('/api/books').send({ title: 'T', author: 'A', isbn: '9780134685991' }),
      'post',
      '/api/books',
    );
    expectToMatchSpec(await request(app).post('/api/books').send({}), 'post', '/api/books');

    jest.mocked(prisma.book.findUniqueOrThrow).mockResolvedValue(book);
    expectToMatchSpec(await request(app).get(`/api/books/${ID}`), 'get', '/api/books/{id}');

    jest.mocked(prisma.book.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('missing', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      }),
    );
    expectToMatchSpec(await request(app).patch(`/api/books/${ID}`).send({ title: 'New' }), 'patch', '/api/books/{id}');

    jest.mocked(prisma.book.delete).mockResolvedValue(book);
    expectToMatchSpec(await request(app).delete(`/api/books/${ID}`), 'delete', '/api/books/{id}');
  });
});
