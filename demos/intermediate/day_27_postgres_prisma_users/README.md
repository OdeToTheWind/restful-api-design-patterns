# Day 27 — PostgreSQL & Prisma Users API

Relational data persistence using Prisma ORM with PostgreSQL, featuring schema migrations, unique constraints, and payload validation.

## Quick Start

- **Default Port**: `3027` (Swagger docs at `http://localhost:3027/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 27 Reflection](../../../docs/progress/day_27_reflection.md)
