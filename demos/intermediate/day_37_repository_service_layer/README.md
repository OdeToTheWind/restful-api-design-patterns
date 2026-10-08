# Day 37 — Repository & Service Layer Pattern

Decoupled three-tier architecture with controller, domain service, and repository layers, supporting dependency injection and in-memory test doubles.

## Quick Start

- **Default Port**: `3037` (Swagger docs at `http://localhost:3037/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 37 Reflection](../../../docs/progress/day_37_reflection.md)
