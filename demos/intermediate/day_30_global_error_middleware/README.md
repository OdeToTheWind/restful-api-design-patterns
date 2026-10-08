# Day 30 — Global Error Middleware

Centralized error handling, operational AppError taxonomy, and unified JSON error envelope formatting without leaking internal stack traces in production.

## Quick Start

- **Default Port**: `3030` (Swagger docs at `http://localhost:3030/api/docs`)
- **Required Services**: None (stateless)

```bash
cp .env.example .env
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 30 Reflection](../../../docs/progress/day_30_reflection.md)
