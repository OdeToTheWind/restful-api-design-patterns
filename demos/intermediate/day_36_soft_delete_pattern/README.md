# Day 36 — Soft Delete Pattern

Transparent soft deletion with Prisma client extensions, partial unique indexes for active records, and trash/restore endpoints.

## Quick Start

- **Default Port**: `3036` (Swagger docs at `http://localhost:3036/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 36 Reflection](../../../docs/progress/day_36_reflection.md)
