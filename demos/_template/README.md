# Demo Template

Starting point for every new day. It already follows the practices fixed during the Day 26–30 review, so each day can focus on its own topic:

| Practice | Where |
|---|---|
| Request id (`X-Request-Id`) + structured request log | `src/app.ts` (`requestId`, `requestLogger`) |
| Security headers + CORS allow-list | `src/app.ts` (`helmet`, `cors`) |
| JSON body size limit | `src/app.ts` (`10kb`) |
| Liveness `/health` + readiness `/ready` (DB ping) | `src/app.ts` (`healthRouter`) |
| Graceful shutdown (drain requests, disconnect DB) | `src/index.ts` (`startServer`) |
| Zod validation of body and route params (unknown keys stripped) | `src/validators/` + `validateBody` / `validateParams` |
| Async errors forwarded to the error handler | `asyncHandler` in `src/routes/` |
| JSON 404 + global error handler, registered last | `src/app.ts` |
| One Prisma client per process, per-demo generated client | `src/lib/prisma.ts`, `prisma/schema.prisma` |
| Environment validated at startup (one Zod schema, no secret defaults) | `loadEnv()` in `src/config/` |
| OpenAPI docs generated from the validators | `src/docs/openapi.ts` → `/api/docs` |
| Credentials only in `.env`, DB bound to localhost | `docker-compose.yml`, `.env.example` |
| Tests with a mocked database | `src/__tests__/` |

The template is part of the pnpm workspace, so CI builds, lints and tests it like any other demo.

## Start a new day

```bash
pnpm new-day 51 hateoas "HATEOAS / Hypermedia Controls"         # from the repo root
pnpm install                                                    # links @restful/shared, generates the Prisma client
cd demos/advanced/day_51_hateoas
cp .env.example .env && docker compose up -d
pnpm prisma:migrate                                             # after editing prisma/schema.prisma
pnpm dev                                                        # http://localhost:3051/api/docs
```

`scripts/new-day.mjs` copies this folder (skipping `node_modules`, `dist`, `generated`), gives the package a unique name, sets the port to `3000 + day`, and renames the database, container and `Day XX` placeholders. Then replace the placeholder `Item` resource with the day's own models, validators, routes and `src/docs/openapi.ts` entries.

Before committing, run `pnpm format` and `pnpm verify` from the repo root. If the day uses a database, add its checks to `scripts/smoke-test.sh` and run `pnpm smoke`.

## Need a secret (e.g. a JWT key)?

```ts
// src/config/index.ts — inside the loadEnv schema
JWT_SECRET: envFields.secret(32),
```

Then add `JWT_SECRET=` to `.env.example`, and set it in `jest.setup.js` for tests (see Day 38).
