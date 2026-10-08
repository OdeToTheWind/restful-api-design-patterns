# Day 33 — Redis Caching & Invalidation

Cache-aside pattern with Redis, cache invalidation on write/update, X-Cache hit/miss headers, and graceful degradation on Redis downtime.

## Quick Start

- **Default Port**: `3033` (Swagger docs at `http://localhost:3033/api/docs`)
- **Required Services**: PostgreSQL (port 5432), Redis (port 6379)

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

- Detailed lesson notes and design decisions: [Day 33 Reflection](../../../docs/progress/day_33_reflection.md)
