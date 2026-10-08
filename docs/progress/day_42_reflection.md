# Day 42 - API Versioning

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Ship breaking changes without breaking clients: run **v1 and v2 side by side**, signal v1's deprecation in every response, and retire it on a known date.

## Key Learnings
- URI versioning (`/api/v1`, `/api/v2`): visible in logs, caches, docs and links
- One domain model and data source; versions differ only in their mappers — business logic is never forked
- Standard deprecation signals on every v1 response: `Deprecation` (RFC 9745), `Sunset` (RFC 8594), `Link: rel="successor-version"`
- After the sunset date v1 answers `410 Gone`; usage of v1 is logged so I know who still needs to migrate
- One OpenAPI document per version (`/api/v1/docs`, `/api/v2/docs`), v1 marked `deprecated`
- `/api/versions` lets clients discover versions and their status

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- `@restful/shared` docs per base path
- **Jest** + **Supertest** (injected clock)

## Project Structure (Day 42)
```
src/catalog/catalog.ts   ← one domain model for every version
src/v1/v1.router.ts      ← v1 mapper + deprecation middleware
src/v2/v2.router.ts      ← v2 mapper (price object, pagination)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | Deprecated shape, no pagination |
| GET | `/api/v2/products?page=&pageSize=&tag=` | New shape, paginated |
| GET | `/api/versions` | Versions and their status |
| GET | `/api/v1/docs, /api/v2/docs` | Docs per version |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_42_api_versioning_uri
cp .env.example .env
pnpm dev
pnpm test
```

### Challenges Faced & Solved
- Two Swagger UIs in one app shared one init script and showed the same spec — `swaggerUi.serveFiles(document)` in the shared `docsRouter` fixes it
- An injected clock makes the sunset behaviour testable without waiting for the date

### Next Steps
- Day 44: test doubles
