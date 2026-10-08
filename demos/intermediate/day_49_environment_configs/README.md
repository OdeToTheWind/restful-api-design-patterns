# Day 49 — Layered Environment Configs & Validation

Hierarchical environment loading (.env.<env>.local to .env), strict startup validation with Zod schemas, production-only rules, and sensitive config redaction.

## Quick Start

- **Default Port**: `3049` (Swagger docs at `http://localhost:3049/api/docs`)
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

- Detailed lesson notes and design decisions: [Day 49 Reflection](../../../docs/progress/day_49_reflection.md)
