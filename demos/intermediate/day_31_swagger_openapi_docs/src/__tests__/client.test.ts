import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../app';
import prisma from '../lib/prisma';
import { createBooksClient } from '../client';

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

// The generated client talking to the real HTTP server — compile-time types, runtime round-trip
let server: Server;
let books: ReturnType<typeof createBooksClient>;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  books = createBooksClient(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const now = new Date();
const book = {
  id: 'clx0000000000000000000001',
  title: 'Refactoring',
  author: 'Martin Fowler',
  isbn: '9780134757599',
  publishedYear: 2018,
  createdAt: now,
  updatedAt: now,
};

it('creates and reads a book through the typed client', async () => {
  jest.mocked(prisma.book.create).mockResolvedValue(book);
  jest.mocked(prisma.book.findUniqueOrThrow).mockResolvedValue(book);

  const created = await books.POST('/api/books', {
    body: { title: 'Refactoring', author: 'Martin Fowler', isbn: '978-0-13-475759-9', publishedYear: 2018 },
  });
  expect(created.response.status).toBe(201);
  expect(created.data?.data.isbn).toBe('9780134757599');

  const fetched = await books.GET('/api/books/{id}', { params: { path: { id: book.id } } });
  expect(fetched.data?.data.title).toBe('Refactoring');
});

it('surfaces documented errors as typed `error` values', async () => {
  const res = await books.POST('/api/books', { body: { title: '', author: 'A', isbn: '1' } });

  expect(res.response.status).toBe(400);
  expect(res.data).toBeUndefined();
  expect(res.error?.message).toBe('Validation failed');
});
