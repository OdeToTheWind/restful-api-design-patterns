# Day 50 — Database Transactions & Concurrency Control

ACID bank transfers using interactive transactions at Serializable isolation, retry with jittered backoff, idempotency keys, and optimistic concurrency (ETag/If-Match).

## Quick Start

- **Default Port**: `3050` (Swagger docs at `http://localhost:3050/api/docs`)
- **Required Services**: PostgreSQL (port 5432)

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

- Detailed lesson notes and design decisions: [Day 50 Reflection](../../../docs/progress/day_50_reflection.md)
