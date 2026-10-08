# Day 41 — Webhook Endpoints & HMAC Signatures

Receiving and verifying external webhooks with HMAC-SHA256 signatures over raw body bytes, replay attack protection, and idempotent event processing.

## Quick Start

- **Default Port**: `3041` (Swagger docs at `http://localhost:3041/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 41 Reflection](../../../docs/progress/day_41_reflection.md)
