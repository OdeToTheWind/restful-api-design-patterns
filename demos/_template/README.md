# Demo Template

Starting point for every new day. It already follows the practices fixed during the Day 26–30 review, so each day can focus on its own topic:

| Practice | Where |
|---|---|
| Request id (`X-Request-Id`) + structured request log | `src/app.ts` (`requestId`, `requestLogger`) |
| Security headers + CORS allow-list | `src/app.ts` (`helmet`, `cors`) |
| JSON body size limit | `src/app.ts` (`10kb`) |
| Zod input validation (unknown keys stripped) | `src/validators/` + `validateBody` |
| Async errors forwarded to the error handler | `asyncHandler` in `src/routes/` |
| JSON 404 + global error handler, registered last | `src/app.ts` |
| One Prisma client per process, per-demo generated client | `src/lib/prisma.ts`, `prisma/schema.prisma` |
| No secret fallbacks | `requireEnv()` in `src/config/` |
| Credentials only in `.env`, DB bound to localhost | `docker-compose.yml`, `.env.example` |
| Tests with a mocked database | `src/__tests__/` |

The template is part of the pnpm workspace, so CI builds, lints and tests it like any other demo.

## Start a new day

```bash
# 1. Copy (skip installed/generated folders — they are recreated by pnpm install)
rsync -a --exclude node_modules --exclude generated --exclude dist \
  demos/_template/ demos/intermediate/day_31_<topic>/

cd demos/intermediate/day_31_<topic>
```

2. Rename. **The package name must be unique in the workspace.**
   - `package.json` → `"name": "day_31_<topic>"` and `"description"`
   - `docker-compose.yml` → `container_name: postgres-day31`
   - `.env.example` → `PORT`, `POSTGRES_DB` and the database name in `DATABASE_URL`
   - `src/index.ts` and `src/app.ts` → replace the `Day XX` / `<Topic>` placeholders
3. Replace the placeholder `Item` resource with the day's models, validators, controller and routes. Delete what you don't need, e.g. Prisma for a day without a database.
4. Install, create the database, and run:

```bash
cd ../../..                      # repo root
pnpm install                     # links @restful/shared, generates the Prisma client
cd demos/intermediate/day_31_<topic>
cp .env.example .env             # then set real values
docker compose up -d
pnpm prisma:migrate              # creates prisma/migrations/
pnpm dev
```

5. Before committing, run this from the repo root: `pnpm verify` (build + lint + tests with coverage). If the day uses a database, add its checks to `scripts/smoke-test.sh` and run `pnpm smoke`.

## Need a secret (e.g. a JWT key)?

```ts
// src/config/index.ts
jwtSecret: requireEnv('JWT_SECRET'),
```

Then add `JWT_SECRET=` to `.env.example`, and set it in `jest.setup.js` for tests (see Day 29).
