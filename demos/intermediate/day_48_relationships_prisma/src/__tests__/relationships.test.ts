import express from 'express';
import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { countOperation, operationCounter } from '../lib/operation-counter';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';

// Each mocked operation also counts itself, like the real client extension does
jest.mock('../lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { countOperation: count } = require('../lib/operation-counter');
  const op = () => jest.fn((..._args: unknown[]) => (count(), Promise.resolve(undefined)));
  return {
    __esModule: true,
    default: {
      course: { create: op(), findMany: op(), findUniqueOrThrow: op(), delete: op() },
      tag: { findMany: op() },
      lesson: { count: op() },
      enrollment: { count: op(), create: op(), findMany: op() },
      student: { create: op() },
      $queryRaw: jest.fn(),
    },
  };
});

const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const STUDENT = 'clx0000000000000000000002';
const now = new Date();
const listItem = (n: number) => ({
  id: `clx00000000000000000000${10 + n}`,
  title: `Course ${n}`,
  tags: [{ name: 'api' }],
  _count: { lessons: 3, enrollments: n },
});
const mocked = jest.mocked(prisma);

beforeEach(() => jest.clearAllMocks());

describe('N+1 made visible', () => {
  it('the proper list is ONE operation, whatever the number of courses', async () => {
    mocked.course.findMany.mockImplementation(
      (() => (countOperation(), Promise.resolve([1, 2, 3, 4].map(listItem)))) as never,
    );

    const res = await request(app).get('/api/courses');

    expect(res.headers['x-prisma-operations']).toBe('1');
    expect(mocked.course.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        title: true,
        tags: { select: { name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    expectToMatchSpec(res, 'get', '/api/courses');
  });

  it('the naive list grows as 1 + 3N (one query per relation per course)', async () => {
    const courses = [1, 2, 3, 4].map((n) => ({ id: listItem(n).id, title: `Course ${n}` }));
    mocked.course.findMany.mockImplementation((() => (countOperation(), Promise.resolve(courses))) as never);
    mocked.tag.findMany.mockImplementation((() => (countOperation(), Promise.resolve([{ name: 'api' }]))) as never);
    mocked.lesson.count.mockImplementation((() => (countOperation(), Promise.resolve(3))) as never);
    mocked.enrollment.count.mockImplementation((() => (countOperation(), Promise.resolve(1))) as never);

    const res = await request(app).get('/api/courses/naive');

    expect(res.headers['x-prisma-operations']).toBe(String(1 + 3 * courses.length));
    expectToMatchSpec(res, 'get', '/api/courses/naive');
  });

  it('counts per request, even when requests overlap', async () => {
    const tiny = express()
      .use(operationCounter)
      .get('/:n', async (req, res) => {
        for (let i = 0; i < Number(req.params.n); i++) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          countOperation();
        }
        res.json({});
      });
    const [a, b] = await Promise.all([request(tiny).get('/2'), request(tiny).get('/5')]);
    expect([a.headers['x-prisma-operations'], b.headers['x-prisma-operations']]).toEqual(['2', '5']);
  });
});

describe('nested writes and includes', () => {
  it('creates a course with numbered lessons and connect-or-create tags', async () => {
    mocked.course.create.mockResolvedValue({
      id: ID,
      title: 'REST',
      createdAt: now,
      lessons: [],
      tags: [{ name: 'api' }],
    } as never);

    const res = await request(app)
      .post('/api/courses')
      .send({
        title: 'REST',
        lessons: [
          { title: 'Intro', durationMinutes: 10 },
          { title: 'Verbs', durationMinutes: 20 },
        ],
        tags: ['API', 'api'],
      });

    expect(res.status).toBe(201);
    expect(mocked.course.create.mock.calls[0][0]).toMatchObject({
      data: {
        title: 'REST',
        lessons: {
          create: [
            { title: 'Intro', durationMinutes: 10, position: 1 },
            { title: 'Verbs', durationMinutes: 20, position: 2 },
          ],
        },
        tags: { connectOrCreate: [{ where: { name: 'api' }, create: { name: 'api' } }] },
      },
    });
    expectToMatchSpec(res, 'post', '/api/courses');
  });

  it('gets a course with ordered lessons, tags and an enrollment count', async () => {
    mocked.course.findUniqueOrThrow.mockResolvedValue({
      id: ID,
      title: 'REST',
      createdAt: now,
      tags: [],
      _count: { enrollments: 2 },
      lessons: [{ id: 'l1', title: 'Intro', position: 1, durationMinutes: 10, courseId: ID }],
    } as never);
    expectToMatchSpec(await request(app).get(`/api/courses/${ID}`), 'get', '/api/courses/{id}');
    expect(mocked.course.findUniqueOrThrow.mock.calls[0][0]).toMatchObject({
      include: { lessons: { orderBy: { position: 'asc' } } },
    });
  });
});

describe('the explicit join model (enrollments)', () => {
  it('enrolls, rejects a second enrollment (409) and unknown students (422)', async () => {
    mocked.enrollment.create.mockResolvedValueOnce({ studentId: STUDENT, courseId: ID, enrolledAt: now } as never);
    expectToMatchSpec(
      await request(app).post(`/api/courses/${ID}/enrollments`).send({ studentId: STUDENT }),
      'post',
      '/api/courses/{id}/enrollments',
    );

    mocked.enrollment.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }) as never,
    );
    expectToMatchSpec(
      await request(app).post(`/api/courses/${ID}/enrollments`).send({ studentId: STUDENT }),
      'post',
      '/api/courses/{id}/enrollments',
    );

    mocked.enrollment.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('fk', { code: 'P2003', clientVersion: '5' }) as never,
    );
    const missing = await request(app).post(`/api/courses/${ID}/enrollments`).send({ studentId: STUDENT });
    expect(missing.status).toBe(422);
    expectToMatchSpec(missing, 'post', '/api/courses/{id}/enrollments');
  });

  it("lists a student's courses through the join model", async () => {
    mocked.enrollment.findMany.mockResolvedValue([{ enrolledAt: now, course: { id: ID, title: 'REST' } }] as never);
    expectToMatchSpec(await request(app).get(`/api/students/${STUDENT}/courses`), 'get', '/api/students/{id}/courses');
  });

  it('creates students and deletes courses', async () => {
    mocked.student.create.mockResolvedValue({ id: STUDENT, name: 'Ada', email: 'ada@example.com' } as never);
    expectToMatchSpec(
      await request(app).post('/api/students').send({ name: 'Ada', email: 'ADA@example.com' }),
      'post',
      '/api/students',
    );
    expectToMatchSpec(await request(app).delete(`/api/courses/${ID}`), 'delete', '/api/courses/{id}');
  });
});
