# Day 39 - Direct Cloud Storage Uploads & Pre-signed S3 URLs

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Implement scalable, secure file uploads directly to **S3-compatible object storage** using pre-signed URLs. The Node.js API must never buffer or stream binary file data directly, client uploads must be strictly verified against declared metadata, and abandoned pending uploads must be automatically cleaned up.

## Key Learnings
- **The Direct-to-Storage Architecture**: Routing large binary file uploads through an Express backend wastes CPU cycles, exhausts memory buffers, and saturates API network bandwidth. Instead, the backend generates short-lived pre-signed PUT URLs, allowing clients to stream bytes directly into object storage.
- **Three-Phase Upload Lifecycle**:
  1. **Initiate (`POST /api/files`)**: Client declares desired filename, content type, and expected byte size. Server validates against whitelists, generates a randomized storage key, saves a `PENDING` database record, and issues a 15-minute pre-signed PUT URL.
  2. **Direct Upload**: The client issues an HTTP `PUT` directly to the S3 bucket with the file body.
  3. **Complete (`POST /api/files/:id/complete`)**: Client informs the backend that the transfer finished. The server issues a `HeadObject` command to verify the object exists and that its actual length and MIME type match the original declaration. If verified, status transitions to `READY`; if invalid, the object is deleted and marked `FAILED` (422).
- **Secure Download URLs**: Secure downloads are distributed via expiring pre-signed GET URLs specifying `ResponseContentDisposition` to ensure browsers preserve the original human-readable filename on download.
- **Abandoned Upload Cleanup System**: If a client requests a pre-signed URL but never completes the upload, orphaned bytes or pending records linger. I implemented an automated cleanup runner (`src/cleanup.ts`) and endpoint (`POST /api/files/cleanup-abandoned`) that queries expired pending records, purges orphaned objects from S3 storage, and marks database entries `EXPIRED`.
- **Readiness Probes Against Storage**: The `/ready` health probe actively tests S3 bucket accessibility via `ListBuckets` or `HeadBucket`, ensuring the API is taken out of rotation if storage infrastructure goes down.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **AWS SDK v3** (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Prisma** + **PostgreSQL**
- **SeaweedFS** (S3-compatible object storage running in Docker)
- **aws-sdk-client-mock** + **Jest** + **Supertest**

## Project Structure (Day 39)
```bash
day_39_file_upload_cloud_storage/
├── src/
│   ├── lib/
│   │   └── storage.ts              # S3 client, presigned URL generation, HeadObject verification
│   ├── controllers/
│   │   └── file.controller.ts      # create, complete, download, delete, and cleanupAbandoned handlers
│   ├── cleanup.ts                  # Scheduled runner script for purging orphaned pending uploads
│   ├── routes/
│   │   └── index.ts
│   ├── docs/
│   │   └── openapi.ts
│   ├── app.ts
│   └── index.ts
├── docker-compose.yml              # PostgreSQL + SeaweedFS with persistent volume and S3 credentials
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/files` | Declare file → returns pre-signed S3 PUT URL | 201 |
| POST | `/api/files/:id/complete` | Verify stored S3 object via HeadObject → status READY | 200 / 422 |
| GET | `/api/files` | List all verified (READY) files | 200 |
| GET | `/api/files/:id/download` | Generate short-lived pre-signed S3 GET download URL | 200 / 404 |
| DELETE | `/api/files/:id` | Delete S3 object and remove database record | 204 / 404 |
| POST | `/api/files/cleanup-abandoned` | Admin/maintenance cleanup of expired pending uploads | 200 |

## HeadObject Verification & Cleanup Workflow

```typescript
// Verification in file.controller.ts
const head = await s3Client.send(new HeadObjectCommand({
  Bucket: config.s3Bucket,
  Key: fileRecord.storageKey
}));

if (head.ContentLength !== fileRecord.sizeBytes) {
  // Purge mismatched payload and reject
  await s3Client.send(new DeleteObjectCommand({
    Bucket: config.s3Bucket,
    Key: fileRecord.storageKey
  }));
  await prisma.file.update({
    where: { id: fileRecord.id },
    data: { status: 'FAILED' }
  });
  throw new AppError('Uploaded file size does not match declared size', 422);
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_39_file_upload_cloud_storage
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Execute file upload, verification, and cleanup unit tests
pnpm test

# Trigger standalone abandoned upload cleanup runner
pnpm cleanup
```

### Challenges Faced & Solved
- **AWS SDK v3 Checksum Calculation Bug**: Recent updates in the `@aws-sdk/client-s3` client calculate a CRC32 checksum by default. When generating a pre-signed PUT URL, the SDK computed the checksum across an empty stream and appended `x-amz-checksum-crc32` to the query string. Consequently, whenever a client uploaded real file bytes, S3 rejected the request due to a checksum mismatch! I configured the client with `requestChecksumCalculation: 'WHEN_REQUIRED'`, and added unit tests confirming presigned URLs contain no unexpected checksum query parameters.
- **MinIO Deprecation & SeaweedFS Adoption**: MinIO recently restricted Docker Hub tags; I switched our local S3-compatible container to SeaweedFS. Configuring real AWS authentication keys ensures signatures are strictly validated by the local storage engine.
- **Reclaiming Storage from Incomplete Uploads**: Addressed the operational risk of users requesting upload URLs and abandoning them by introducing `cleanupAbandoned` to sweep and reclaim S3 storage and database rows older than 15 minutes.

### Next Steps
- Implement background queue processing for asynchronous email notifications using BullMQ and Redis in Day 40.

---

**Status: ✅ Day 39 Successfully Completed**  
**Progress: 39/100 Days**  
**Milestone: Enterprise direct-to-cloud file upload architecture built with pre-signed S3 URLs, metadata verification, and automated abandoned upload reclamation.**
