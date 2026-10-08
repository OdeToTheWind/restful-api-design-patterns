# Day 48 — Database Relationships & N+1 Prevention

Prisma relational modeling (1:N, M:N), nested transactional writes, cascade deletes, and operation instrumentation to detect and eliminate N+1 queries.

## Quick Start

- **Default Port**: `3048` (Swagger docs at `http://localhost:3048/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 48 Reflection](../../../docs/progress/day_48_reflection.md)
