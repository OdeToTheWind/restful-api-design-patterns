import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createTodoSchema, todoIdParamsSchema, updateTodoSchema } from '../controllers/todo.controller';

const api = createApiRegistry();
const { registry } = api;

const Todo = registry.register(
  'Todo',
  z.object({
    _id: z.string().describe('MongoDB ObjectId'),
    title: z.string(),
    completed: z.boolean(),
    createdAt: z.string().datetime(),
    __v: z.number().int().describe('Mongoose document version'),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/todos',
  tags: ['Todos'],
  summary: 'List todos, newest first',
  responses: { 200: api.success('Todos', z.array(Todo)) },
});
registry.registerPath({
  method: 'post',
  path: '/api/todos',
  tags: ['Todos'],
  request: { body: jsonContent(createTodoSchema) },
  responses: { 201: api.success('Created', Todo), 400: api.error('Validation failed') },
});
registry.registerPath({
  method: 'put',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  request: { params: todoIdParamsSchema, body: jsonContent(updateTodoSchema) },
  responses: { 200: api.success('Updated', Todo), 400: api.error('Validation failed'), 404: api.error('Not found') },
});
registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: ['Todos'],
  request: { params: todoIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day 26 — Todos API (MongoDB + Mongoose)' });
