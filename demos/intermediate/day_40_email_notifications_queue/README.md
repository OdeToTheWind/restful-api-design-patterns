# Day 40 — Email Notifications Queue & Worker

Asynchronous job processing with BullMQ on Redis, Mailpit SMTP delivery, retry backoff with dead-letter admin endpoints, and idempotency keys.

## Quick Start

- **Default Port**: `4040` (Swagger docs at `http://localhost:4040/api/docs`)
- **Required Services**: Redis (port 6379), Mailpit SMTP (port 1025) & Web (port 8025)

```bash
cp .env.example .env
docker compose up -d
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 40 Reflection](../../../docs/progress/day_40_reflection.md)
