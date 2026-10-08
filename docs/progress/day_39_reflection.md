# Day 39 - File Upload to Cloud Storage

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Upload files **directly to S3-compatible storage** with pre-signed URLs, so file bytes never pass through the API — and verify what was really uploaded.

## Key Learnings
- Three steps: declare the file → get a short-lived pre-signed PUT URL → upload straight to storage → `complete`
- Validate before signing (type whitelist, size limit) and store under a random key — user input never decides object paths
- The client can lie about size and type, so `complete` checks the stored object with `HeadObject`; mismatches are deleted (422)
- Downloads are short-lived pre-signed GET URLs with `Content-Disposition` for the original file name
- Readiness includes the bucket: uploads are useless without storage
- SeaweedFS locally (S3 API), any S3-compatible service in production

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL** (file metadata)
- **AWS SDK v3** (`@aws-sdk/client-s3`, `s3-request-presigner`)
- **SeaweedFS** (S3-compatible) in Docker
- **aws-sdk-client-mock**, **Jest**

## Project Structure (Day 39)
```
src/lib/storage.ts                 ← S3 client, presign upload/download, HeadObject
src/controllers/file.controller.ts ← create → complete → download → delete
docker-compose.yml                 ← Postgres + SeaweedFS with credentials from .env
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files` | Declare a file → pre-signed upload URL |
| POST | `/api/files/:id/complete` | Verify the stored object → READY |
| GET | `/api/files` | Ready files |
| GET | `/api/files/:id/download` | Short-lived download URL |
| DELETE | `/api/files/:id` | Delete object + record |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_39_file_upload_cloud_storage
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- **Real bug found by the smoke test:** recent AWS SDK versions add a CRC32 checksum to requests by default, and for a pre-signed PUT it was computed over an *empty* body and signed into the URL — every real upload failed. Fixed with `requestChecksumCalculation: 'WHEN_REQUIRED'`, and a unit test now checks no checksum is signed into upload URLs
- The MinIO image is no longer published on Docker Hub; switched to SeaweedFS and configured real credentials so signatures are actually verified (a tampered URL gets 403)

### Next Steps
- Day 40: send emails through a queue
