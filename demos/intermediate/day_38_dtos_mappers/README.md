# Day 38 — DTOs & Mappers

Explicit Data Transfer Objects and mappers separating persistence models from API representations for public, user, and admin views.

## Quick Start

- **Default Port**: `3038` (Swagger docs at `http://localhost:3038/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 38 Reflection](../../../docs/progress/day_38_reflection.md)
