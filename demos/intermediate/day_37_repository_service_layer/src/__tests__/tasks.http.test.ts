import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import { openApiDocument } from '../docs/openapi';
import { InMemoryTaskRepository } from '../repositories/in-memory-task.repository';
import { TaskService } from '../services/task.service';

// The whole HTTP stack with a real service and in-memory storage — no Prisma, no mocks
const expectToMatchSpec = createContractMatcher(openApiDocument);
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp({ taskService: new TaskService(new InMemoryTaskRepository()) });
});

it('runs a task through its whole lifecycle over HTTP', async () => {
  const created = await request(app).post('/api/tasks').send({ title: 'Ship Day 37', dueDate: '2099-01-01' });
  expect(created.status).toBe(201);
  expectToMatchSpec(created, 'post', '/api/tasks');
  const { id } = created.body.data;

  expectToMatchSpec(
    await request(app).put(`/api/tasks/${id}/status`).send({ status: 'IN_PROGRESS' }),
    'put',
    '/api/tasks/{id}/status',
  );
  const done = await request(app).put(`/api/tasks/${id}/status`).send({ status: 'DONE' });
  expect(done.body.data.completedAt).not.toBeNull();

  const list = await request(app).get('/api/tasks?status=DONE');
  expect(list.body.data.map((t: { id: string }) => t.id)).toEqual([id]);
  expectToMatchSpec(list, 'get', '/api/tasks');

  const blocked = await request(app).delete(`/api/tasks/${id}`);
  expect(blocked.status).toBe(409);
  expectToMatchSpec(blocked, 'delete', '/api/tasks/{id}');
});

it('maps business-rule violations to 409 and validation errors to 400', async () => {
  const { body } = await request(app).post('/api/tasks').send({ title: 'Plan' });

  const skip = await request(app).put(`/api/tasks/${body.data.id}/status`).send({ status: 'DONE' });
  expect(skip.status).toBe(409);
  expect(skip.body.errors.status[0]).toMatch(/allowed from TODO: IN_PROGRESS/);

  expect((await request(app).put(`/api/tasks/${body.data.id}/status`).send({ status: 'ARCHIVED' })).status).toBe(400);
  expect((await request(app).post('/api/tasks').send({ title: 'Old', dueDate: '2000-01-01' })).status).toBe(400);
  expect((await request(app).get('/api/tasks?status=nope')).status).toBe(400);
  expect((await request(app).patch(`/api/tasks/${body.data.id}`).send({})).status).toBe(400);
});

it('edits, fetches and deletes open tasks; unknown ids are 404', async () => {
  const { body } = await request(app).post('/api/tasks').send({ title: 'Draft' });
  const id = body.data.id;

  expectToMatchSpec(
    await request(app).patch(`/api/tasks/${id}`).send({ description: 'More detail' }),
    'patch',
    '/api/tasks/{id}',
  );
  expectToMatchSpec(await request(app).get(`/api/tasks/${id}`), 'get', '/api/tasks/{id}');
  expectToMatchSpec(await request(app).delete(`/api/tasks/${id}`), 'delete', '/api/tasks/{id}');
  expectToMatchSpec(await request(app).get(`/api/tasks/${id}`), 'get', '/api/tasks/{id}');
});

it('serves health, readiness (from injected checks) and docs', async () => {
  const withChecks = createApp({
    taskService: new TaskService(new InMemoryTaskRepository()),
    readinessChecks: { database: () => Promise.reject(new Error('down')) },
  });
  expect((await request(withChecks).get('/ready')).status).toBe(503);
  expect((await request(app).get('/health')).status).toBe(200);
  expect((await request(app).get('/')).body.day).toBe(37);
});
