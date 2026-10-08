# Day 29 — Role-Based Access Control (RBAC)

Hierarchical role-based access control protecting resources with granular permission checks, OpenAPI security schemes, and admin guards.

## Quick Start

- **Default Port**: `3029` (Swagger docs at `http://localhost:3029/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 29 Reflection](../../../docs/progress/day_29_reflection.md)
