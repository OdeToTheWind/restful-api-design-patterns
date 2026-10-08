# Day 34 — Winston Logging & Context Redaction

Structured JSON logging with Winston, AsyncLocalStorage request context propagation, and deep redaction of sensitive credentials.

## Quick Start

- **Default Port**: `3034` (Swagger docs at `http://localhost:3034/api/docs`)
- **Required Services**: None (in-memory)

```bash
cp .env.example .env
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 34 Reflection](../../../docs/progress/day_34_reflection.md)
