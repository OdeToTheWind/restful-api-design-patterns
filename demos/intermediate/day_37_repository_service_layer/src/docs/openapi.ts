import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { TASK_STATUSES } from '../domain/task';
import {
  createTaskSchema,
  editTaskSchema,
  listTasksQuery,
  taskIdParamsSchema,
  transitionSchema,
} from '../validators/task.schema';

const api = createApiRegistry();
const { registry } = api;

const Task = registry.register(
  'Task',
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(TASK_STATUSES),
    dueDate: z.string().datetime().nullable(),
    completedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'List tasks (soonest due first)',
  request: { query: listTasksQuery },
  responses: { 200: api.success('Tasks', z.array(Task)), 400: api.error('Invalid status filter') },
});
registry.registerPath({
  method: 'post',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'Create a task (starts as TODO; due date must not be in the past)',
  request: { body: jsonContent(createTaskSchema) },
  responses: { 201: api.success('Created', Task), 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'get',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Get one task',
  request: { params: taskIdParamsSchema },
  responses: { 200: api.success('The task', Task), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'patch',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Edit title, description or due date (not allowed once DONE)',
  request: { params: taskIdParamsSchema, body: jsonContent(editTaskSchema.innerType()) },
  responses: {
    200: api.success('Updated', Task),
    400: api.error('Validation failed'),
    404: api.error('Not found'),
    409: api.error('Task is DONE'),
  },
});
registry.registerPath({
  method: 'put',
  path: '/api/tasks/{id}/status',
  tags: ['Tasks'],
  summary: 'Move a task through the workflow',
  description: 'Allowed: TODO → IN_PROGRESS → DONE, IN_PROGRESS → TODO, DONE → IN_PROGRESS (reopen).',
  request: { params: taskIdParamsSchema, body: jsonContent(transitionSchema) },
  responses: {
    200: api.success('Updated', Task),
    400: api.error('Validation failed'),
    404: api.error('Not found'),
    409: api.error('Transition not allowed'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Delete a task (completed tasks are kept)',
  request: { params: taskIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 404: api.error('Not found'), 409: api.error('Task is DONE') },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 37 — Tasks API (repository + service layer)',
});
