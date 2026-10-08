import { createApiRegistry, generateOpenApiDocument, jsonContent } from '@restful/shared';
import { z } from 'zod';
import { createUploadSchema, fileIdParamsSchema } from '../validators/file.schema';

const api = createApiRegistry();
const { registry } = api;

const File = registry.register(
  'File',
  z.object({
    id: z.string(),
    key: z.string(),
    filename: z.string(),
    contentType: z.string(),
    sizeBytes: z.number().int(),
    status: z.enum(['PENDING', 'READY']),
    createdAt: z.string().datetime(),
    uploadedAt: z.string().datetime().nullable(),
  }),
);
const Upload = z.object({
  method: z.literal('PUT'),
  url: z.string().url().describe('Pre-signed URL: PUT the raw file bytes here, with the given headers'),
  headers: z.object({ 'Content-Type': z.string() }),
  expiresIn: z.number().int(),
});

registry.registerPath({
  method: 'post',
  path: '/api/files',
  tags: ['Files'],
  summary: '1. Declare a file and get a pre-signed upload URL',
  request: { body: jsonContent(createUploadSchema) },
  responses: {
    201: api.success('Upload URL', z.object({ file: File, upload: Upload })),
    400: api.error('Type not allowed or file too large'),
  },
});
registry.registerPath({
  method: 'post',
  path: '/api/files/{id}/complete',
  tags: ['Files'],
  summary: '3. Verify the uploaded object and mark the file READY',
  request: { params: fileIdParamsSchema },
  responses: {
    200: api.success('Ready', File),
    404: api.error('Unknown file'),
    409: api.error('Nothing uploaded yet'),
    422: api.error('Stored object does not match the declaration (it was deleted)'),
  },
});
registry.registerPath({
  method: 'get',
  path: '/api/files',
  tags: ['Files'],
  summary: 'Ready files',
  responses: { 200: api.success('Files', z.array(File)) },
});
registry.registerPath({
  method: 'get',
  path: '/api/files/{id}/download',
  tags: ['Files'],
  summary: 'A short-lived download URL',
  request: { params: fileIdParamsSchema },
  responses: {
    200: api.success('Download URL', z.object({ url: z.string().url(), expiresIn: z.number().int() })),
    404: api.error('Unknown file'),
    409: api.error('Not uploaded yet'),
  },
});
registry.registerPath({
  method: 'delete',
  path: '/api/files/{id}',
  tags: ['Files'],
  request: { params: fileIdParamsSchema },
  responses: { 200: api.success('Deleted', z.null()), 404: api.error('Unknown file') },
});

export const openApiDocument = generateOpenApiDocument(registry, {
  title: 'Day 39 — File uploads with pre-signed URLs',
});
