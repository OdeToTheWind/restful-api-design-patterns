# Day 42 — API Versioning (URI Pattern)

Multi-version API routing (/v1, /v2) sharing domain logic with version-specific DTO mappers, Sunset/Deprecation headers, and 410 Gone handling.

## Quick Start

- **Default Port**: `3042` (Swagger docs at `http://localhost:3042/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 42 Reflection](../../../docs/progress/day_42_reflection.md)
