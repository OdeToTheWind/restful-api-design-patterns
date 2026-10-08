# Day 45 — Integration Testing with Testcontainers

Isolated integration testing spinning up real PostgreSQL containers via Testcontainers to validate real schema constraints, migrations, and database queries.

## Quick Start

- **Default Port**: `3045` (Swagger docs at `http://localhost:3045/api/docs`)
- **Required Services**: Docker / Testcontainers

```bash
cp .env.example .env
pnpm prisma:migrate
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 45 Reflection](../../../docs/progress/day_45_reflection.md)
