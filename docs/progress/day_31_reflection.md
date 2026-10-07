# Day 31 - Spec-first OpenAPI Docs

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Design the Books API **contract first** — Zod schemas plus documented operations — and generate everything else from it: request validation, the OpenAPI 3.1 document, Swagger UI and a fully typed client.

## Key Learnings
- Spec-first means the contract is the source of truth; handlers implement it, they don't define it
- `@asteasolutions/zod-to-openapi` turns the same Zod schemas used by `validateBody` into OpenAPI — docs can't drift from validation
- Committing generated artifacts (`openapi.json`, `src/client/schema.d.ts`) and failing CI when they're stale (`pnpm openapi:check`)
- `openapi-typescript` + `openapi-fetch` give a client where paths, params, bodies and responses are all type-checked
- Contract tests validate real responses against the document with closed objects, so undocumented fields fail
- Moving the registry helpers (`createApiRegistry`, `docsRouter`) into `@restful/shared` so every demo documents itself the same way

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **zod-to-openapi**, **swagger-ui-express**
- **openapi-typescript**, **openapi-fetch**
- **Jest** + **Supertest**, Ajv (contract tests)

## Project Structure (Day 31)
```
src/
├── contract/
│   ├── books.contract.ts   ← schemas + documented operations (the contract)
│   ├── artifacts.ts        ← renders openapi.json
│   └── generate.ts         ← `pnpm openapi:generate` / `openapi:check`
├── client/
│   ├── schema.d.ts         ← generated types (committed)
│   └── index.ts            ← createBooksClient(baseUrl)
├── controllers/book.controller.ts
└── routes/book.routes.ts
openapi.json                ← generated spec (committed)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List books, newest first |
| POST | `/api/books` | Add a book (ISBN normalised) |
| GET | `/api/books/:id` | Get one book |
| PATCH | `/api/books/:id` | Update some fields |
| DELETE | `/api/books/:id` | Remove a book |
| GET | `/api/docs` | Swagger UI (+ `/api/docs/openapi.json`) |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_31_swagger_openapi_docs
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm openapi:generate             # after changing the contract
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- `openapi-typescript` loads an ESM-only dependency, which Jest can't `require` — the drift test runs `generate.ts --check` in a child process instead, which also tests the exact command CI uses
- Running Prettier over the repo reformatted the generated files, and the drift test caught it immediately — generated files are now in `.prettierignore`
- `publishedYear` was first capped at the current year, which would have changed the spec every January — it now has a fixed upper bound

### Next Steps
- Day 32: pagination, filtering and sorting on top of this documentation style
