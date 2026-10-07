import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createItemSchema, itemIdParamsSchema, updateItemSchema } from '../validators/item.schema';

// Request schemas come from the validators, so the docs always match what the API accepts
const api = createApiRegistry();
const { registry } = api;

const Item = registry.register(
  'Item',
  z.object({ id: z.string(), name: z.string(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() }),
);

registry.registerPath({
  method: 'get',
  path: '/api/items',
  tags: ['Items'],
  summary: 'List items, newest first',
  responses: { 200: api.success('Items', z.array(Item)) },
});

registry.registerPath({
  method: 'post',
  path: '/api/items',
  tags: ['Items'],
  summary: 'Create an item',
  request: { body: jsonContent(createItemSchema) },
  responses: { 201: api.success('Created', Item), 400: api.error('Validation failed') },
});

registry.registerPath({
  method: 'put',
  path: '/api/items/{id}',
  tags: ['Items'],
  summary: 'Update an item',
  request: { params: itemIdParamsSchema, body: jsonContent(updateItemSchema) },
  responses: { 200: api.success('Updated', Item), 400: api.error('Validation failed'), 404: api.error('Not found') },
});

registry.registerPath({
  method: 'delete',
  path: '/api/items/{id}',
  tags: ['Items'],
  summary: 'Delete an item',
  request: { params: itemIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, { title: 'Day XX — <Topic> API' });
