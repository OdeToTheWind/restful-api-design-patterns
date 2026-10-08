import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createCourseSchema, createStudentSchema, enrollSchema, idParamsSchema } from '../validators/course.schema';

const api = createApiRegistry();
const { registry } = api;

const TagRef = z.object({ name: z.string() });
const Lesson = z.object({
  id: z.string(),
  title: z.string(),
  position: z.number().int(),
  durationMinutes: z.number().int(),
  courseId: z.string(),
});
const CourseListItem = registry.register(
  'CourseListItem',
  z.object({
    id: z.string(),
    title: z.string(),
    tags: z.array(TagRef),
    _count: z.object({ lessons: z.number().int(), enrollments: z.number().int() }),
  }),
);
const Course = registry.register(
  'Course',
  z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string().datetime(),
    lessons: z.array(Lesson),
    tags: z.array(TagRef),
    _count: z.object({ enrollments: z.number().int() }).optional(),
  }),
);
const operationsHeader = {
  'X-Prisma-Operations': {
    description: 'Database round trips used to answer this request',
    schema: { type: 'integer' as const },
  },
};

registry.registerPath({
  method: 'get',
  path: '/api/courses',
  tags: ['Courses'],
  summary: 'List with tags and counts in ONE operation',
  responses: { 200: { ...api.success('Courses', z.array(CourseListItem)), headers: operationsHeader } },
});
registry.registerPath({
  method: 'get',
  path: '/api/courses/naive',
  tags: ['Courses'],
  summary: 'Same result with the N+1 anti-pattern (1 + 3N operations) — for comparison',
  responses: { 200: { ...api.success('Courses', z.array(CourseListItem)), headers: operationsHeader } },
});
registry.registerPath({
  method: 'post',
  path: '/api/courses',
  tags: ['Courses'],
  summary: 'Nested write: course + lessons + tags',
  request: { body: jsonContent(createCourseSchema) },
  responses: { 201: api.success('Created', Course), 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'get',
  path: '/api/courses/{id}',
  tags: ['Courses'],
  request: { params: idParamsSchema },
  responses: { 200: api.success('Course with lessons', Course), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'delete',
  path: '/api/courses/{id}',
  tags: ['Courses'],
  summary: 'Deletes lessons and enrollments too (cascade)',
  request: { params: idParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'post',
  path: '/api/courses/{id}/enrollments',
  tags: ['Enrollments'],
  request: { params: idParamsSchema, body: jsonContent(enrollSchema) },
  responses: {
    201: api.success(
      'Enrolled',
      z.object({ studentId: z.string(), courseId: z.string(), enrolledAt: z.string().datetime() }),
    ),
    409: api.error('Already enrolled'),
    422: api.error('Course or student does not exist'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/students',
  tags: ['Students'],
  request: { body: jsonContent(createStudentSchema) },
  responses: {
    201: api.success('Created', z.object({ id: z.string(), name: z.string(), email: z.string() })),
    409: api.error('Email taken'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/students/{id}/courses',
  tags: ['Students'],
  request: { params: idParamsSchema },
  responses: {
    200: api.success(
      'Enrollments',
      z.array(z.object({ enrolledAt: z.string().datetime(), course: z.object({ id: z.string(), title: z.string() }) })),
    ),
  },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 48 — Relationships (Prisma)' });
