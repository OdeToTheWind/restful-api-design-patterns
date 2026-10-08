# Day 43 — Cookie-Based Sessions & CSRF Protection

Session management with httpOnly, SameSite cookies for rotating refresh tokens, double-submit CSRF prevention, and active session revocation.

## Quick Start

- **Default Port**: `3043` (Swagger docs at `http://localhost:3043/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 43 Reflection](../../../docs/progress/day_43_reflection.md)
