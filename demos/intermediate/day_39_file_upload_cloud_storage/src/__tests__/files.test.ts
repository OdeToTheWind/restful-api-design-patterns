import request from 'supertest';
import { mockClient } from 'aws-sdk-client-mock';
import { DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import prisma from '../lib/prisma';
import { s3 } from '../lib/storage';
import { openApiDocument } from '../docs/openapi';
import { Prisma } from '../../generated/prisma';
import { runCleanup } from '../cleanup';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    file: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

// Intercepts every command sent by the real S3 client; pre-signing still runs for real (offline)
const s3Mock = mockClient(s3);
const expectToMatchSpec = createContractMatcher(openApiDocument);
const ID = 'clx0000000000000000000001';
const now = new Date();
const file = (overrides = {}) => ({
  id: ID,
  key: 'uploads/1f0e5c1e-0000-4000-8000-000000000001',
  filename: 'diagram.png',
  contentType: 'image/png',
  sizeBytes: 1024,
  status: 'PENDING' as const,
  createdAt: now,
  uploadedAt: null,
  ...overrides,
});
const notFound = Object.assign(new Error('NotFound'), { name: 'NotFound' });

beforeEach(() => {
  jest.clearAllMocks();
  s3Mock.reset();
});

describe('POST /api/files (pre-signed upload URL)', () => {
  it('records a PENDING file under a random key and returns a signed PUT URL', async () => {
    jest
      .mocked(prisma.file.create)
      .mockImplementation(((args: { data: object }) => Promise.resolve(file(args.data))) as never);

    const res = await request(app)
      .post('/api/files')
      .send({ filename: '../../etc/passwd.png', contentType: 'image/png', sizeBytes: 1024 });

    expect(res.status).toBe(201);
    const { data } = jest.mocked(prisma.file.create).mock.calls[0][0];
    expect(data.key).toMatch(/^uploads\/[0-9a-f-]{36}$/);
    expect(data.filename).toBe('.._.._etc_passwd.png');
    const url = new URL(res.body.data.upload.url);
    expect(url.pathname).toBe(`/uploads/${data.key}`);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    // A checksum signed into the URL would be for an empty body and break every real upload
    expect([...url.searchParams.keys()].filter((key) => key.toLowerCase().includes('checksum'))).toEqual([]);
    expectToMatchSpec(res, 'post', '/api/files');
  });

  it.each([
    [{ filename: 'run.exe', contentType: 'application/x-msdownload', sizeBytes: 10 }, 'contentType'],
    [{ filename: 'huge.png', contentType: 'image/png', sizeBytes: 50 * 1024 * 1024 }, 'sizeBytes'],
    [{ filename: '', contentType: 'image/png', sizeBytes: 10 }, 'filename'],
  ])('rejects %p', async (body, field) => {
    const res = await request(app).post('/api/files').send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
    expect(prisma.file.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/files/:id/complete (verify what was stored)', () => {
  it('marks the file READY when the stored object matches the declaration', async () => {
    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValue(file());
    jest.mocked(prisma.file.update).mockResolvedValue(file({ status: 'READY', uploadedAt: now }));
    s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 1024, ContentType: 'image/png' });

    const res = await request(app).post(`/api/files/${ID}/complete`);

    expect(res.status).toBe(200);
    expect(prisma.file.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: { status: 'READY', uploadedAt: expect.any(Date) },
    });
    expectToMatchSpec(res, 'post', '/api/files/{id}/complete');
  });

  it('409 while nothing has been uploaded', async () => {
    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValue(file());
    s3Mock.on(HeadObjectCommand).rejects(notFound);
    expectToMatchSpec(await request(app).post(`/api/files/${ID}/complete`), 'post', '/api/files/{id}/complete');
  });

  it.each([
    ['a bigger file than declared', { ContentLength: 999_999, ContentType: 'image/png' }],
    ['a different content type', { ContentLength: 1024, ContentType: 'text/html' }],
  ])('rejects %s with 422 and deletes the object and the record', async (_case, head) => {
    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValue(file());
    s3Mock.on(HeadObjectCommand).resolves(head);
    s3Mock.on(DeleteObjectCommand).resolves({});

    const res = await request(app).post(`/api/files/${ID}/complete`);

    expect(res.status).toBe(422);
    expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toMatchObject({
      Bucket: 'uploads',
      Key: file().key,
    });
    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it('is idempotent once READY', async () => {
    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValue(file({ status: 'READY', uploadedAt: now }));
    expect((await request(app).post(`/api/files/${ID}/complete`)).status).toBe(200);
    expect(s3Mock.commandCalls(HeadObjectCommand)).toHaveLength(0);
  });
});

describe('download, list and delete', () => {
  it('gives a short-lived download URL for READY files only', async () => {
    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValueOnce(file({ status: 'READY', uploadedAt: now }));
    const ok = await request(app).get(`/api/files/${ID}/download`);
    const url = new URL(ok.body.data.url);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(url.searchParams.get('response-content-disposition')).toBe('attachment; filename="diagram.png"');
    expectToMatchSpec(ok, 'get', '/api/files/{id}/download');

    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValueOnce(file());
    expect((await request(app).get(`/api/files/${ID}/download`)).status).toBe(409);
  });

  it('lists READY files and deletes object + record', async () => {
    jest.mocked(prisma.file.findMany).mockResolvedValue([file({ status: 'READY', uploadedAt: now })]);
    expectToMatchSpec(await request(app).get('/api/files'), 'get', '/api/files');
    expect(prisma.file.findMany).toHaveBeenCalledWith({ where: { status: 'READY' }, orderBy: { uploadedAt: 'desc' } });

    jest.mocked(prisma.file.findUniqueOrThrow).mockResolvedValue(file());
    s3Mock.on(DeleteObjectCommand).resolves({});
    expectToMatchSpec(await request(app).delete(`/api/files/${ID}`), 'delete', '/api/files/{id}');
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);

    jest
      .mocked(prisma.file.findUniqueOrThrow)
      .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('none', { code: 'P2025', clientVersion: '5' }));
    expect((await request(app).delete(`/api/files/${ID}`)).status).toBe(404);
  });
});

describe('runCleanup (src/cleanup.ts)', () => {
  it('removes expired PENDING uploads and deletes their storage objects', async () => {
    const expiredFile = file({
      id: 'expired-1',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 600 * 1000),
      key: 'uploads/expired-1',
    });
    jest.mocked(prisma.file.findMany).mockResolvedValue([expiredFile]);
    s3Mock.on(DeleteObjectCommand).resolves({});

    const res = await runCleanup();

    expect(res.cleanedCount).toBe(1);
    expect(res.cleanedIds).toEqual(['expired-1']);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 'expired-1' } });
  });
});

it('readiness includes the storage bucket', async () => {
  jest.mocked(prisma.$queryRaw).mockResolvedValue([] as never);
  s3Mock.on(HeadBucketCommand).rejects(new Error('connect ECONNREFUSED'));
  const res = await request(app).get('/ready');
  expect(res.status).toBe(503);
  expect(res.body.errors).toEqual({ database: 'up', storage: 'down' });
});
