# Day 32 — Advanced Pagination, Filtering & Sorting

Offset and keyset/cursor pagination, whitelisted dynamic sorting, and multi-field filtering with metadata envelopes.

## Quick Start

- **Default Port**: `3032` (Swagger docs at `http://localhost:3032/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 32 Reflection](../../../docs/progress/day_32_reflection.md)
