# Day 31 - Spec-first OpenAPI Documentation & Type-Safe Client

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Design and implement the Books API using a **spec-first (contract-first) architecture**. The core goal is establishing a single source of truth where Zod schemas define runtime request validation, generate the complete OpenAPI 3.1 specification document and Swagger UI, and output an end-to-end type-safe API client without any schema duplication.

## Key Learnings
- **The Contract as Single Source of Truth**: Handlers must implement the contract rather than defining it ad-hoc. Moving from docstrings/annotations to schema-driven contracts guarantees that API documentation and runtime behavior never diverge.
- **`@asteasolutions/zod-to-openapi` Integration**: By extending Zod with OpenAPI metadata (`.openapi({ ... })`), the exact schemas used in `validateBody` also build the OpenAPI 3.1 component definitions and path operations.
- **Drift Prevention in CI**: Committing generated artifacts (`openapi.json` and `src/client/schema.d.ts`) and failing the build with `pnpm openapi:check` ensures every developer and automated pipeline treats the contract as non-negotiable.
- **Fully Typed Client via `openapi-fetch`**: Pairing `openapi-typescript` with `openapi-fetch` yields a lightweight client where URL paths, route parameters, request payloads, and response bodies are validated at compile time with zero manual type authoring.
- **Strict Contract Testing**: Verifying real Express responses against the compiled OpenAPI schema with closed objects so that undocumented response properties or mismatched status codes immediately break tests.
- **Reusable Registry Helpers**: Extracting `createApiRegistry` and `docsRouter` into `@restful/shared` so every subsequent demo provides identical documentation and testing capabilities.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL** (Docker containerized)
- **`@asteasolutions/zod-to-openapi`** + **`swagger-ui-express`**
- **`openapi-typescript`** + **`openapi-fetch`**
- **Jest** + **Supertest** + **Ajv** (contract testing)

## Project Structure (Day 31)
```bash
day_31_swagger_openapi_docs/
├── src/
│   ├── contract/
│   │   ├── books.contract.ts   # Zod schemas + documented operations (the contract)
│   │   ├── artifacts.ts        # Renders OpenAPI 3.1 specification document
│   │   └── generate.ts         # CLI tool for `pnpm openapi:generate` and check
│   ├── client/
│   │   ├── schema.d.ts         # Generated TypeScript types (committed)
│   │   └── index.ts            # createBooksClient(baseUrl) implementation
│   ├── controllers/
│   │   └── book.controller.ts  # Thin business logic implementing contract
│   ├── routes/
│   │   └── book.routes.ts      # Express route mapping with validateBody
│   ├── app.ts                  # App configuration with shared docsRouter
│   └── index.ts
├── openapi.json                # Generated OpenAPI 3.1 specification
├── tsconfig.json
├── package.json
└── docker-compose.yml
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/books` | List books ordered newest first | 200 |
| POST | `/api/books` | Add a new book (ISBN normalized and validated) | 201 |
| GET | `/api/books/:id` | Fetch specific book by CUID identifier | 200 / 404 |
| PATCH | `/api/books/:id` | Partially update fields of an existing book | 200 / 404 |
| DELETE | `/api/books/:id` | Remove a book record | 204 / 404 |
| GET | `/api/docs` | Interactive Swagger UI documentation | 200 |
| GET | `/api/docs/openapi.json` | Raw OpenAPI 3.1 specification | 200 |

## Contract Definition Pattern

```typescript
// src/contract/books.contract.ts
import { z } from 'zod';
import { registry } from './registry';

export const BookSchema = registry.register(
  'Book',
  z.object({
    id: z.string().cuid().openapi({ example: 'clh8v2abc000008l07b6c5q1z' }),
    title: z.string().min(1).max(255).openapi({ example: 'Designing Data-Intensive Applications' }),
    author: z.string().min(1).max(255).openapi({ example: 'Martin Kleppmann' }),
    isbn: z.string().regex(/^(97(8|9))?\d{9}(\d|X)$/).openapi({ example: '9781449373320' }),
    publishedYear: z.number().int().min(1450).max(2100).openapi({ example: 2017 }),
    createdAt: z.string().datetime().openapi({ example: '2026-10-08T12:00:00.000Z' }),
    updatedAt: z.string().datetime().openapi({ example: '2026-10-08T12:00:00.000Z' })
  })
);

export const CreateBookSchema = registry.register(
  'CreateBookInput',
  BookSchema.omit({ id: true, createdAt: true, updatedAt: true })
);
```

## How to Run & Verify

```bash
# Setup database and run migrations
cd demos/intermediate/day_31_swagger_openapi_docs
cp .env.example .env
docker compose up -d
pnpm prisma:migrate

# Generate or verify contract artifacts
pnpm openapi:generate
pnpm openapi:check

# Start development server
pnpm dev

# Run comprehensive unit & contract tests
pnpm test
```

### Challenges Faced & Solved
- **ESM-Only Dependency in Jest**: `openapi-typescript` relies on pure ESM modules that Jest cannot easily require in CommonJS mode. Rather than complicating the Jest runner configuration, I implemented the drift test (`openapi:check`) to execute `generate.ts --check` inside a child process. This had the added advantage of verifying the exact CLI script used in the CI pipeline.
- **Prettier Reformatting Generated Specs**: Running Prettier across the workspace modified line breaks and formatting in `openapi.json`, tripping the drift check. I placed all generated artifacts into `.prettierignore` so they remain strictly byte-for-byte identical to the generator output.
- **Dynamic Date Validation Drift**: An earlier version constrained `publishedYear` with `z.number().max(new Date().getFullYear())`. This caused the generated schema to mutate on January 1st every year. I stabilized the contract by setting an explicit static boundary (`max(2100)`).

### Next Steps
- Implement advanced pagination (offset and keyset/cursor), filtering, and sorting in Day 32 on top of this spec-first foundation.

---

**Status: ✅ Day 31 Successfully Completed**  
**Progress: 31/100 Days**  
**Milestone: Spec-first API design mastered with contract testing, automated OpenAPI 3.1 generation, and end-to-end type-safe client.**
