# Day 46 — Docker Containerization & Compose

Production-ready multi-stage non-root container image, Docker Compose with automated migration jobs, health checks, and Caddy reverse proxy TLS.

## Quick Start

- **Default Port**: `3046` (Swagger docs at `http://localhost:3046/api/docs`)
- **Required Services**: PostgreSQL (port 5432), Caddy (port 8080/8443)

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

- Detailed lesson notes and design decisions: [Day 46 Reflection](../../../docs/progress/day_46_reflection.md)
