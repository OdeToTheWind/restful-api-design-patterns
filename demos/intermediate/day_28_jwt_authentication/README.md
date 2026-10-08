# Day 28 — JWT Authentication & Refresh Tokens

Secure authentication using access tokens and rotating refresh tokens with bcrypt password hashing, timing-safe verification, and credential-stuffing protection.

## Quick Start

- **Default Port**: `3028` (Swagger docs at `http://localhost:3028/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 28 Reflection](../../../docs/progress/day_28_reflection.md)
