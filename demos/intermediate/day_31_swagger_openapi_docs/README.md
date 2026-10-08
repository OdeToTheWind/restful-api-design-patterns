# Day 31 — Spec-First Swagger & OpenAPI Docs

API specification-first workflow with OpenAPI 3.1, interactive Swagger UI, request/response validation, and generated typed contracts.

## Quick Start

- **Default Port**: `3031` (Swagger docs at `http://localhost:3031/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 31 Reflection](../../../docs/progress/day_31_reflection.md)
