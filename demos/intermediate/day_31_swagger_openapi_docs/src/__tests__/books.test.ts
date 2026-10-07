import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';

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
    $queryRaw: jest.fn(),
  },
}));

const ID = 'clx0000000000000000000001';
const now = new Date();
const book = {
  id: ID,
  title: 'The Pragmatic Programmer',
  author: 'David Thomas, Andrew Hunt',
  isbn: '9780134685991',
  publishedYear: 2019,
  createdAt: now,
  updatedAt: now,
};
const knownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Simulated', { code, clientVersion: Prisma.prismaVersion.client });

beforeEach(() => jest.clearAllMocks());

describe('POST /api/books', () => {
  it('normalises the ISBN and creates the book from contract fields only', async () => {
    jest.mocked(prisma.book.create).mockResolvedValue(book);

    const res = await request(app).post('/api/books').send({
      title: ' The Pragmatic Programmer ',
      author: 'David Thomas, Andrew Hunt',
      isbn: '978-0-13-468599-1',
      id: 'x',
    });

    expect(res.status).toBe(201);
    expect(prisma.book.create).toHaveBeenCalledWith({
      data: { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', isbn: '9780134685991' },
    });
  });

  it.each([
    [{ author: 'A', isbn: '9780134685991' }, 'title'],
    [{ title: 'T', author: 'A', isbn: '12345' }, 'isbn'],
    [{ title: 'T', author: 'A', isbn: '9780134685991', publishedYear: 1200 }, 'publishedYear'],
  ])('rejects %p with 400', async (body, field) => {
    const res = await request(app).post('/api/books').send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
  });

  it('maps a duplicate ISBN to 409', async () => {
    jest.mocked(prisma.book.create).mockRejectedValue(knownError('P2002'));
    const res = await request(app).post('/api/books').send({ title: 'T', author: 'A', isbn: '9780134685991' });
    expect(res.status).toBe(409);
  });
});

describe('GET, PATCH, DELETE /api/books/:id', () => {
  it('gets a book, or 404 when missing', async () => {
    jest.mocked(prisma.book.findUniqueOrThrow).mockResolvedValueOnce(book);
    expect((await request(app).get(`/api/books/${ID}`)).status).toBe(200);

    jest.mocked(prisma.book.findUniqueOrThrow).mockRejectedValueOnce(knownError('P2025'));
    expect((await request(app).get(`/api/books/${ID}`)).status).toBe(404);
  });

  it('patches only the provided fields and rejects an empty patch', async () => {
    jest.mocked(prisma.book.update).mockResolvedValue({ ...book, publishedYear: 2020 });

    expect((await request(app).patch(`/api/books/${ID}`).send({ publishedYear: 2020 })).status).toBe(200);
    expect(prisma.book.update).toHaveBeenCalledWith({ where: { id: ID }, data: { publishedYear: 2020 } });

    expect((await request(app).patch(`/api/books/${ID}`).send({})).status).toBe(400);
  });

  it('deletes a book and rejects malformed ids', async () => {
    jest.mocked(prisma.book.delete).mockResolvedValue(book);
    expect((await request(app).delete(`/api/books/${ID}`)).status).toBe(200);
    expect((await request(app).delete('/api/books/not-a-cuid')).status).toBe(400);
  });

  it('lists books newest first', async () => {
    jest.mocked(prisma.book.findMany).mockResolvedValue([book]);
    const res = await request(app).get('/api/books');
    expect(res.body.data).toHaveLength(1);
    expect(prisma.book.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });
});

describe('app-level middleware', () => {
  it('serves health, security headers and a JSON 404', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/')).headers['x-content-type-options']).toBe('nosniff');
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });

  it('reports readiness from the database', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValueOnce([] as never);
    expect((await request(app).get('/ready')).status).toBe(200);
    jest.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('down') as never);
    expect((await request(app).get('/ready')).status).toBe(503);
  });
});
