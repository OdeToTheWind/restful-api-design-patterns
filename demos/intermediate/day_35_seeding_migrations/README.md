# Day 35 — Database Seeding & Migrations

Deterministic, idempotent database seeding with configurable profiles, snapshot verification, and automated migration management.

## Quick Start

- **Default Port**: `3035` (Swagger docs at `http://localhost:3035/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 35 Reflection](../../../docs/progress/day_35_reflection.md)
