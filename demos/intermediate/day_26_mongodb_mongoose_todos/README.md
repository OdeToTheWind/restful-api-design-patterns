# Day 26 — MongoDB & Mongoose Todos API

Document storage with MongoDB and Mongoose schemas, demonstrating schema validation, query filters, and clean lifecycle hooks.

## Quick Start

- **Default Port**: `3026` (Swagger docs at `http://localhost:3026/api/docs`)
- **Required Services**: MongoDB (port 27017)

```bash
cp .env.example .env
docker compose up -d
# MongoDB collections are created automatically
pnpm dev
```

## Testing & Quality

```bash
pnpm test:coverage
```

## Architecture & Reflection

- Detailed lesson notes and design decisions: [Day 26 Reflection](../../../docs/progress/day_26_reflection.md)
