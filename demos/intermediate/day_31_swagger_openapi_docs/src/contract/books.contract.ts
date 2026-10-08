import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';

/**
 * Spec-first: the contract is written before any handler. These schemas are the single
 * source of truth — the routes validate requests with them, the OpenAPI document is
 * generated from them, and the typed client in src/client is generated from that document.
 */

// ISBN-10 or ISBN-13, digits only (hyphens/spaces are stripped first)
const isbn = z
  .string()
  .transform((value) => value.replace(/[-\s]/g, ''))
  .pipe(z.string().regex(/^(\d{9}[\dX]|\d{13})$/, 'must be a valid ISBN-10 or ISBN-13'))
  .openapi({ example: '978-0-13-468599-1' });

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(200).openapi({ example: 'The Pragmatic Programmer' }),
  author: z.string().trim().min(1).max(120).openapi({ example: 'David Thomas, Andrew Hunt' }),
  isbn,
  publishedYear: z.number().int().min(1450).max(2100).optional().openapi({ example: 2019 }),
});

export const updateBookSchema = createBookSchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Provide at least one field to update',
});

export const bookIdParamsSchema = z.object({ id: z.string().cuid().openapi({ example: 'clx0000000000000000000001' }) });

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;

const api = createApiRegistry();
const { registry } = api;

const Book = registry.register(
  'Book',
  z.object({
    id: z.string(),
    title: z.string(),
    author: z.string(),
    isbn: z.string(),
    publishedYear: z.number().int().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/books',
  operationId: 'listBooks',
  tags: ['Books'],
  summary: 'List books, newest first',
  responses: { 200: api.success('Books', z.array(Book)) },
});

registry.registerPath({
  method: 'post',
  path: '/api/books',
  operationId: 'createBook',
  tags: ['Books'],
  summary: 'Add a book',
  request: { body: jsonContent(createBookSchema) },
  responses: {
    201: api.success('Created', Book),
    400: api.error('Validation failed'),
    409: api.error('A book with this ISBN already exists'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/books/{id}',
  operationId: 'getBook',
  tags: ['Books'],
  summary: 'Get one book',
  request: { params: bookIdParamsSchema },
  responses: { 200: api.success('The book', Book), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

registry.registerPath({
  method: 'patch',
  path: '/api/books/{id}',
  operationId: 'updateBook',
  tags: ['Books'],
  summary: 'Update some fields of a book',
  request: { params: bookIdParamsSchema, body: jsonContent(updateBookSchema) },
  responses: {
    200: api.success('Updated', Book),
    400: api.error('Validation failed'),
    404: api.error('Not found'),
    409: api.error('A book with this ISBN already exists'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/books/{id}',
  operationId: 'deleteBook',
  tags: ['Books'],
  summary: 'Remove a book',
  request: { params: bookIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 400: api.error('Invalid id'), 404: api.error('Not found') },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 31 — Books API (spec-first)',
  description: 'Contract written first; validation, docs and the typed client are all generated from it.',
});
