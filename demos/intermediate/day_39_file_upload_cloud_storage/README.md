# Day 39 — File Upload to S3-Compatible Cloud Storage

Direct-to-storage uploads via short-lived pre-signed S3 URLs, metadata verification via HeadObject before activation, and automated cleanup jobs.

## Quick Start

- **Default Port**: `3039` (Swagger docs at `http://localhost:3039/api/docs`)
- **Required Services**: PostgreSQL (port 5432), S3 / SeaweedFS (port 8333)

```bash
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 39 Reflection](../../../docs/progress/day_39_reflection.md)
