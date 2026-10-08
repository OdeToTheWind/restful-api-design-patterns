# 📊 Repository Assessment Report

**Project**: RESTful API Design Patterns — 100 Days Challenge  
**Author**: Bhargavi Badal  
**Assessed On**: October 7, 2026  
**Last Updated**: October 8, 2026 — full re-audit after Day 50 ([Section 7](#7-identified-flaws--issues--status-tracker), issues #34–#52); pending work in [Section 9](#9-next-steps)  
**Repository**: [OdeToTheWind/restful-api-design-patterns](https://github.com/OdeToTheWind/restful-api-design-patterns)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Progress Overview](#2-progress-overview)
3. [Structural Analysis](#3-structural-analysis)
4. [Code Quality Analysis](#4-code-quality-analysis)
5. [Security Audit](#5-security-audit)
6. [Documentation Quality](#6-documentation-quality)
7. [Identified Flaws & Issues — Status Tracker](#7-identified-flaws--issues--status-tracker)
8. [Implementation Log (Remediation Pass)](#8-implementation-log-remediation-pass)
9. [Next Steps](#9-next-steps)
10. [Strategic Roadmap (Days 31–100)](#10-strategic-roadmap-days-31100)
11. [Closing Assessment](#11-closing-assessment)

**Status legend:** ✅ Fixed · 🟡 Partially fixed · ❌ Open · ➖ Not an issue / expected

---

## 1. Executive Summary

This is a **well-structured, disciplined learning project** with a clear commitment to building RESTful API design skills step by step. 50 of the 100 planned days are complete — the beginner and intermediate phases — covering Express basics through auth, RBAC, caching, queues, webhooks, versioning, transactions, Docker and CI.

The original assessment found critical gaps in security, TypeScript discipline, monorepo setup and testing. Every one of those 33 issues is resolved. The pipeline is genuinely strong. Re-verified on October 8, 2026:
- `pnpm install --frozen-lockfile`, `audit` (0 known vulnerabilities), `build`, `lint`, `format:check` and `test:coverage` all pass: 51 packages, **447 passing tests**, coverage gates enforced.
- `pnpm smoke` passes **212 checks** against real PostgreSQL, MongoDB, Redis, S3-compatible storage and SMTP, including graceful SIGTERM shutdown and 20 concurrent money transfers. The Testcontainers suite (6 tests) passes too.
- The latest `main` run is green ([run](https://github.com/OdeToTheWind/restful-api-design-patterns/actions/runs/37802119044)). `main` requires `verify (20.x)`, `verify (24.x)`, `smoke` and `docker`.

**The re-audit found 19 new issues (#34–#52), 3 of them high severity.** They are concentrated in code the tooling doesn't reach:
- **Unprotected admin endpoints.** Days 39 and 40 shipped destructive or data-exposing endpoints with no authentication.
- **Unchecked lesson snapshots.** A path-traversal file delete sits in Day 22. Beginner demos aren't linted or tested, so nothing caught it.
- **Docs that over-claim.** This report, the README and the Day 47 README had drifted from the code: stale counts, a "parallelized" smoke test that runs sequentially, and a tech stack listing tools that aren't used yet.
- **A roadmap that repeats itself.** Eight planned advanced days repeat topics Days 26–50 already covered.

**Overall Score: 7.2 → 9.2 → 8.4 / 10** (original → before re-audit → now)

| Dimension | Original | Before re-audit | Now | What the re-audit changed |
|---|---|---|---|---|
| Structural Organization | 8.5 | 9.5 | 9.0 | Smoke phases each start the full container stack; 23 of 24 intermediate demos have no README |
| Code Quality (Beginner Phase) | 7.5 | 7.5 | 6.5 | Path-traversal file delete in Day 22 (#36); never linted or tested |
| Code Quality (Intermediate Phase) | 7.0 | 9.0 | 8.5 | Day 39 cleanup logic duplicated; Day 40 admin routes bypass the routes/controllers layering |
| TypeScript Discipline | 6.0 | 8.5 | 8.5 | Unchanged — no `any` in intermediate code, ESLint enforces it |
| Security Practices | 5.0 | 9.0 | 7.5 | Two unauthenticated admin endpoints (#34, #35); `TRUST_PROXY` defaults to `true` (#41) |
| Documentation Consistency | 8.0 | 9.0 | 7.5 | This report contradicted itself; README promised tools that aren't used; roadmap overlaps |
| Monorepo Configuration | 4.5 | 9.0 | 8.5 | CI still tests Node 20 (end-of-life since April 2026); Dependabot ignores every major upgrade |
| Testing | 1.0 | 9.5 | 9.0 | Day 46 has no contract test; Day 49's coverage excludes the config code the day is about |

> Scores are judgement-based (the overall score is not a plain average), matching how the original report scored.

---

## 2. Progress Overview

### Completion Status

```
Total Planned:   100 demos
Completed:        50 days (50%)
Planned (todo):   50 days (50%)
```

### Phase Breakdown

| Phase | Range | Demos Done | Status |
|---|---|---|---|
| **Beginner** | Days 1–25 | 25/25 | ✅ Complete |
| **Intermediate** | Days 26–50 | 25/25 | ✅ Complete |
| **Advanced** | Days 51–75 | 0/25 | 📋 Planned (needs re-scoping, see #47) |
| **Real-World** | Days 76–100 | 0/25 | 📋 Planned |

### Topic Coverage Map (Beginner Phase ✅)

| Topic | Day | Status |
|---|---|---|
| Express Server | 01 | ✅ |
| Routing + Controller Pattern | 02 | ✅ |
| Full CRUD (in-memory) | 03, 04, 05 | ✅ |
| HTTP Methods Best Practices | 06 | ✅ |
| Status Codes | 07 | ✅ |
| Query/Path Parameters | 08, 09 | ✅ |
| Error Handling Intro | 10 | ✅ |
| Middleware | 11, 12 | ✅ |
| Input Validation (Zod) | 13 | ✅ |
| Logging | 14 | ✅ |
| Pagination | 15, 16 | ✅ |
| Nested Resources | 17 | ✅ |
| Idempotency (PUT/DELETE) | 18 | ✅ |
| PATCH / Partial Updates | 19 | ✅ |
| Response Formatting | 20 | ✅ |
| File Upload (Multer) | 21, 22 | ✅ (Day 22 has an open traversal bug, #36) |
| Bulk Operations | 23 | ✅ |
| Rate Limiting | 24 | ✅ |
| MVC Refactor (Capstone) | 25 | ✅ |

The beginner demos have no automated tests and are excluded from ESLint by design (ADR-007).

### Topic Coverage Map (Intermediate Phase ✅)

| Topic | Day | Status | Automated tests |
|---|---|---|---|
| MongoDB + Mongoose | 26 | ✅ | 16 |
| PostgreSQL + Prisma | 27 | ✅ | 19 |
| JWT Authentication | 28 | ✅ | 32 |
| RBAC (Roles & Permissions) | 29 | ✅ | 50 |
| Global Error Middleware | 30 | ✅ | 10 |
| Spec-first OpenAPI + typed client | 31 | ✅ | 16 (incl. drift check) |
| Pagination, filtering, sorting | 32 | ✅ | 17 |
| Redis caching | 33 | ✅ | 10 |
| Log context + redaction | 34 | ✅ | 7 (+ shared log-context suite) |
| Seeding + migrations | 35 | ✅ | 12 (incl. snapshot) |
| Soft delete | 36 | ✅ | 10 |
| Repository + service layer | 37 | ✅ | 14 (no Prisma mocks) |
| DTOs + mappers | 38 | ✅ | 16 |
| File upload to cloud storage | 39 | ✅ | 13 |
| Email notifications via a queue | 40 | ✅ | 15 |
| Webhooks | 41 | ✅ | 20 |
| API versioning | 42 | ✅ | 9 |
| Cookie-based sessions + CSRF | 43 | ✅ | 14 |
| Test doubles + coverage | 44 | ✅ | 16 |
| Integration testing (Testcontainers) | 45 | ✅ | 7 unit + 6 real-database |
| Docker containerization | 46 | ✅ | 13 + CI `docker` job (no contract test, #42) |
| GitHub Actions CI hardening | 47 | ✅ | — (the pipeline itself; no code) |
| DB relationships | 48 | ✅ | 8 |
| Environment configs | 49 | ✅ | 18 (config code excluded from coverage, #43) |
| DB transactions | 50 | ✅ | 14 |

Plus 59 tests in `@restful/shared` and 12 in `demos/_template`. Every database-backed intermediate demo except Day 45 (Testcontainers) and Day 46 (CI `docker` job) is also covered by `pnpm smoke`.

---

## 3. Structural Analysis

### Folder Architecture (current)

```
restful-api-design-patterns/
├── .github/
│   ├── workflows/ci-cd.yml       ← verify (audit → build → lint → format → test:coverage) · smoke · docker (+ GHCR publish on main)
│   └── dependabot.yml            ← weekly grouped minor/patch updates (majors ignored)
├── docker/demo.Dockerfile        ← production image for any demo (Day 46)
├── scripts/
│   ├── new-day.mjs               ← pnpm new-day: scaffold a day from demos/_template
│   ├── smoke-test.sh             ← runs all smoke phases (pnpm smoke)
│   ├── smoke/                    ← common.sh + phase-1-core / phase-2-services / phase-3-advanced
│   └── coverage-summary.mjs      ← coverage table for the CI job summary
├── .nvmrc                        ← Node 22
├── eslint.config.mjs             ← typescript-eslint; scope: shared + intermediate+
├── .prettierrc.json, .editorconfig ← formatting (pnpm format / format:check in CI)
├── package.json                  ← workspace root (packageManager: pnpm@9.15.9)
├── pnpm-workspace.yaml           ← packages: shared, demos/*/*, demos/_template
├── pnpm-lock.yaml                ← single lockfile for the whole workspace
├── demos/
│   ├── _template/     (starting point for new days — built & tested in CI)
│   ├── beginner/      (25 demos ✅ — standalone lesson snapshots)
│   ├── intermediate/  (25 days ✅ — 24 use @restful/shared; Day 47 is pipeline-only)
│   ├── advanced/      (.gitkeep — future phase)
│   └── real-world/    (.gitkeep — future phase)
├── docs/
│   ├── progress/      (50 reflection files, one per day)
│   └── architecture/system_design.md  ← patterns + 31 ADRs
├── shared/                       ← @restful/shared package
│   ├── src/
│   │   ├── response.ts           ApiResponse (typed, generic)
│   │   ├── errors.ts             AppError
│   │   ├── async-handler.ts      asyncHandler
│   │   ├── error-handler.ts      errorHandler, notFoundHandler, normalizeError
│   │   ├── validate.ts           validateBody / validateQuery / validateParams (Zod)
│   │   ├── health.ts             healthRouter: /health, /ready
│   │   ├── server.ts             startServer: graceful SIGTERM/SIGINT shutdown
│   │   ├── logger.ts             Winston logger (JSON in prod, silent in tests)
│   │   ├── log-context.ts        AsyncLocalStorage request context + redaction
│   │   ├── request-context.ts    requestId (X-Request-Id), requestLogger
│   │   ├── openapi.ts            createApiRegistry, docsRouter (Swagger UI)
│   │   ├── pagination.ts         offset + cursor pagination helpers
│   │   ├── env.ts                loadEnv, envFields
│   │   ├── testing/              createContractMatcher (import from @restful/shared/testing)
│   │   ├── types/express.ts      AuthUser, isAuthUser, req.user / req.id augmentation
│   │   └── __tests__/            59 tests
│   └── package.json, tsconfig.json, jest.config.js
└── README.md
```

**Within each intermediate demo** (`demos/_template` has the same layout):

```
day_XX/
├── prisma/schema.prisma   ← output = "../generated/prisma"
├── generated/prisma/      ← per-demo Prisma client (git-ignored, created on install)
├── src/
│   ├── app.ts             ← requestId → helmet/cors → routes → notFoundHandler → errorHandler
│   ├── index.ts           ← listen only (startServer)
│   ├── config/            ← env loading via loadEnv; required vars fail fast
│   ├── controllers/       ← thin, async, throw AppError
│   ├── lib/prisma.ts      ← PrismaClient singleton
│   ├── middleware/        ← auth, rbac, rate-limit
│   ├── services/          ← business rules (Days 28/29 token rotation, Day 37 layering)
│   ├── docs/openapi.ts    ← OpenAPI document generated from the validators
│   ├── routes/            ← validateBody(...) + asyncHandler(...)
│   ├── validators/        ← Zod schemas
│   └── __tests__/         ← Jest + Supertest + contract matcher
├── .env.example
├── jest.config.js, jest.setup.js
├── package.json, tsconfig.json
```

### Strengths of Structure

- **Progressive layering**: Each demo adds exactly what the day's topic requires — not more. Day 01 has just routes, Day 25 has full MVC, Day 28 has auth middleware. Clean and deliberate.
- **Consistent file naming**: `*.controller.ts`, `*.routes.ts`, `*.middleware.ts` throughout. Readable and predictable.
- **Independent demo isolation**: Each demo still runs on its own with `pnpm dev`, while sharing one lockfile and the `@restful/shared` building blocks.
- **Shared layer is live**: response envelope, errors, validation, logging, health, shutdown, OpenAPI, pagination, env loading and contract testing exist once.
- **`demos/_template` + `pnpm new-day`**: new days start with every established practice in place, and the template is built and tested in CI.

### Problems with Structure

- ✅ ~~`shared/` directory is completely empty~~ → now the `@restful/shared` package.
- ✅ ~~No root `pnpm-workspace.yaml`; CI calls a missing `turbo.json`~~ → workspace + plain `pnpm -r` CI.
- ✅ ~~`docs/architecture/system_design.md` is a stub~~ → request pipeline, shared package reference, 31 ADRs.
- ✅ ~~`node_modules/` tracked in git (≈4,100 files)~~ → untracked and ignored.
- ✅ ~~`shared/components/` and `shared/hooks/` frontend placeholders~~ → removed.
- ❌ *(new, #44)* **Smoke phases aren't really split.** Every phase calls `start_infrastructure`, which starts all six containers (Postgres, MongoDB, two Redis, SeaweedFS, Mailpit). So `pnpm smoke` boots the full stack three times, even though Phase 3 needs only Postgres. CI runs the three phases one after another in a single job, so nothing runs in parallel. The Day 28 "refuses to start without `JWT_SECRET`" check sits in Phase 3 (Days 44–50).
- ❌ *(new, #48)* **No per-demo README.** Only `demos/_template` and Day 47 have one. How to run a demo, which services it needs (Redis, S3, Mailpit) and which port it uses are spread across reflections and `.env.example` files. Days 28 and 29 both default to port 3028, so they can't run side by side.
- ❌ *(new, #45)* **A private maintenance note is committed to the repo root** (added in #9). It was meant to stay local, like the other local instruction file (which is excluded via `.git/info/exclude`). Its content contradicts the repository's own attribution policy.

---

## 4. Code Quality Analysis

### Positive Patterns

**1. Consistent `ApiResponse` utility** — Every demo from Day 20 onward uses a clean static class for responses. It now lives once in `@restful/shared` and is fully typed:

```typescript
ApiResponse.success(res, data, "Message", 201);
ApiResponse.error(res, "Message", 400);
```

**2. Clean Express app setup** — `app.ts` stays minimal and delegates to routes. `index.ts` handles only the listen call.

**3. Good progression of complexity** — Controller pattern (Day 2) → Models (Day 3) → Middleware (Day 11) → MVC refactor (Day 25) → Real DB (Day 26) → Auth (Day 28) → layers, DTOs, queues, transactions (Days 37–50).

**4. Prisma schema design is solid** — cuid IDs, enums for roles, `updatedAt` tracking, partial unique indexes (Day 36), explicit join tables (Day 48).

**5. Password security** — `bcryptjs` with 10 salt rounds; timing-safe login; 8–72 character passwords.

**6. Thin controllers** — validation lives in Zod schemas, error forwarding in `asyncHandler`, status mapping in `errorHandler`.

**7. Observable requests** — every response carries an `X-Request-Id`, every log line carries the request context, and secrets are redacted automatically.

**8. Real-infrastructure verification** — bugs that mocks hid were caught by running against real services: a checksum signed into every upload URL (Day 39) and serialization conflicts surfacing as 500s under concurrent transfers (Day 50).

### Code Issues Found (with status)

Issues 1–7 are from the original report, all ✅ fixed:

| # | Issue | Fix |
|---|---|---|
| 1 | `(req as any).user` bypassed type safety | `Express.Request` augmented with `user?: AuthUser`; payload checked by `isAuthUser()`; ESLint fails on `any` |
| 2 | `PrismaClient` created per controller | One client per demo in `src/lib/prisma.ts` |
| 3 | No async error handling | `asyncHandler` + global `errorHandler`; P2002 → 409, P2025 → 404, Mongoose Cast/Validation → 400; unknown → generic 500 |
| 4 | JWT secret fallback hard-coded | Read once from validated config, no fallback; `jwt.verify` pinned to HS256 |
| 5 | RBAC self-promotion (Day 29) | Zod strips `role` and the controller builds `data` explicitly; covered by a test |
| 6 | Empty `lib/` in Day 28 | Holds the Prisma singleton |
| 7 | `code.text` scratch file | Deleted |

New issues from the re-audit:

**Issue 8: Day 39 cleanup logic exists twice** — ❌ **Open** (#46)

`FileController.cleanupAbandoned` re-implements `runCleanup()` from `src/cleanup.ts` line for line instead of calling it. Any fix to one, such as making the S3 delete and DB delete safe to retry, has to be repeated in the other. The endpoint is also unauthenticated (see Security, #35).

**Issue 9: Day 40 admin routes defined inline in `app.ts`** — ❌ **Open** (part of #34)

The dead-letter endpoints live in `app.ts` instead of `routes/` + `controllers/`, the opposite of the layering the rest of the demos teach. Moving them is also the natural place to add the missing auth.

**Issue 10: Day 22 builds file paths from raw input** — ❌ **Open** (#36)

`deleteAsset` does `path.join(UPLOADS_DIR, req.params.filename)`. Express decodes `%2F` inside route params, so `DELETE /api/assets/..%2F..%2Fpackage.json` resolves to a path outside `uploads/` (verified: the param arrives as `../../package.json`).

---

## 5. Security Audit

> The original findings are all resolved. The re-audit found three new high-severity issues, and all three are endpoints that were never put behind authentication or a path check. See [Next Steps](#9-next-steps).

### 🔴 Critical: Real Secrets Committed to Git — ✅ Resolved / corrected

**Finding 1 — MongoDB connection string with credentials in `day_30_reflection.md`.**
- **Status:** removed from the reflection doc. The quoted string was also removed from this report, which had repeated the password.
- **Verification:** `git log --all -S` shows it was **never committed**.
- **Remaining risk:** if the Atlas user is real and the file was ever shared or synced elsewhere, rotating the password is still cheap insurance (see Next Steps).

**Finding 2 — "Real `.env` files committed to Git" — ➖ Original finding was incorrect.**
- `demos/intermediate/` `.env` files have never been committed, and `.gitignore` excludes `.env`.
- `.env.example` files exist for every intermediate demo.

### 🟠 High (new): Unauthenticated dead-letter admin endpoints (Day 40) — ❌ Open

- `GET /api/admin/emails/failed` returns up to 100 failed jobs to anyone, including each recipient's email address (`to`).
- `POST /api/admin/emails/failed/:jobId/retry` lets anyone re-send a failed email.
- **Fix:** require an admin credential (an `X-Admin-Key` checked with `timingSafeEqual`, as Day 49 does, or JWT + RBAC from Day 29). Then add tests for 401 without it and 200 with it.

### 🟠 High (new): Unauthenticated destructive cleanup endpoint (Day 39) — ❌ Open

`POST /api/files/cleanup-abandoned` deletes S3 objects and database rows, and any client can call it. A scheduled job doesn't need an HTTP endpoint at all — `src/cleanup.ts` already runs standalone.
- **Fix:** remove the endpoint (preferred), or protect it like the Day 40 fix.

### 🟠 High (new): Path traversal → arbitrary file delete (Day 22) — ❌ Open

See Code Issue 10.
- **Fix:** `path.basename(filename)`, then refuse the request unless `path.resolve(UPLOADS_DIR, name)` starts with `UPLOADS_DIR + path.sep`.
- Beginner demos are kept as lesson snapshots (ADR-007). A one-line fix with a comment explaining it is still better than leaving a working exploit in a portfolio repo.

### 🟡 Medium (new): `TRUST_PROXY` defaults to `true` (Day 46) — ❌ Open

- Day 46's config defaults `TRUST_PROXY` to `true`. Its compose file also publishes the API directly on `127.0.0.1:3046`, next to Caddy. Any client that reaches the API without going through the proxy can set `X-Forwarded-For` and `X-Forwarded-Proto` to whatever it likes.
- That doesn't matter today, because Day 46 has no IP-based rate limit. But the Dockerfile and compose setup are meant to be reused, and Days 28/29 rate-limit by IP.
- Caddy's ports bind to all interfaces (`8080`, `8443`), while every other service binds to `127.0.0.1`.
- `/api/proxy-info`, a debugging endpoint, ships in the production image.
- **Fix:** default to `false` and set `TRUST_PROXY=true` only in compose. Bind Caddy to `127.0.0.1` locally. Gate `/api/proxy-info` behind `NODE_ENV !== 'production'`.

### 🟠 High: Self-Promotion to Admin Role (Day 29) — ✅ Fixed

Described under Code Issue 5 and covered by tests. The same class of bug (mass assignment) was also found and fixed in **Day 27** `POST/PUT /users`.

### 🟠 High: User list exposed to every logged-in user (Day 29) — ✅ Fixed

`GET /api/users` is restricted to `ADMIN` and `MODERATOR`.

### 🟡 Medium: Rate limiting, input validation, token lifetime, login timing — ✅ Fixed

- **Rate limits:** auth routes allow 10 attempts per 15 minutes per IP, and `/login` adds 5 failed logins per email (ADR-012).
- **Validation:** Zod validates every body, param and query.
- **Tokens:** access tokens last 15 minutes, with rotating, hashed refresh tokens and reuse detection (ADR-009). Day 43 moves the refresh token into an httpOnly `SameSite=Strict` cookie with double-submit CSRF.
- **Login timing:** an unknown email still runs a dummy bcrypt compare, so both failure paths take the same time.

### 🟢 Low: Compose credentials, security headers, dependency audit — ✅ Fixed

- **Compose:** credentials come from `.env`, and ports bind to `127.0.0.1` (except Caddy, see above).
- **Headers:** `helmet()` and an allow-list CORS policy are applied everywhere.
- **Dependencies:** CI runs `pnpm audit --prod --audit-level high` (0 known vulnerabilities on October 8, 2026), and Dependabot opens weekly update PRs.

---

## 6. Documentation Quality

### Strengths

- **50 reflection files** — one per day, consistently structured: Objective, Key Learnings, Tech Stack, Project Structure, API Endpoints, Challenges, Next Steps.
- **31 ADRs** in `system_design.md`, one per significant decision, including the Days 31–50 patterns.
- **OpenAPI everywhere** — 23 of 24 code demos serve OpenAPI 3.1 + Swagger UI. Their real responses are contract-tested against the document (the exception is Day 46, #42).
- **Reflections stay true** — Days 26–30 end with a dated Follow-up section describing later changes.

### Weaknesses

- ✅ ~~`system_design.md` is a skeleton~~ → 31 ADRs.
- ✅ ~~README phase table / Days 31–40 status stale~~ → corrected.
- ✅ ~~`day_30_reflection.md` ends with an exposed credential~~ → removed.
- ✅ *(re-audit, #50)* ~~This report contradicted itself~~ → corrected in this update. It had:
  - four different ADR counts (8, 10, 12, 22; the real count is 31);
  - a tree listing "16 days" and "Days 31–49 are drafts";
  - "Day 43 planned" in the security intro;
  - "merge the open PRs and rewrite the drafts" in the closing, both long done;
  - 443 tests (real: 447) and 52 shared tests (real: 59);
  - a CI link to an old run;
  - a claim that the smoke phases run in parallel.
- ✅ *(re-audit, #51)* ~~README over-claims~~ → corrected in this update. It had:
  - Fastify/NestJS, RabbitMQ/Kafka, OpenTelemetry/Prometheus/Grafana, Kubernetes and blue-green/canary listed as the tech stack;
  - HATEOAS and observability listed as implemented features;
  - "BullMQ (advanced demos)" (it's Day 40);
  - "CI on every push" (CI runs on pushes to `main`/`develop` and PRs to `main`);
  - a `pnpm new-day 50` example for a day that exists;
  - Getting Started steps that mention only Postgres;
  - a "MVC Refractor" typo.
- ❌ *(re-audit, #49)* **Stale numbers in other files:**
  - `dependabot.yml` says "31 workspace packages" (it's 51);
  - the CI smoke comment says "Days 26–43" (it's 26–50);
  - Day 47's README says "300+ tests" and links `smoke-test.sh`, which is now only a runner for the phase scripts;
  - root `package.json` has `author: "Bhargavi"`.
- ❌ *(re-audit, #52)* **The Days 31–50 reflections don't read like learning notes.**
  - All 20 are dated October 8, 2026, and the code for all 20 days landed in four PRs on that same day.
  - Their voice is uniform and polished: long bolded bullet lists, 630–955 words each, against 300–460 for Days 1–30.
  - They describe what the code does well. They rarely say what was confusing, what broke or what I'd do differently.
  - For a learning challenge, that is the most valuable part, and the part a reviewer of the portfolio will look for.

---

## 7. Identified Flaws & Issues — Status Tracker

### Original Findings

| # | Issue | Severity | Location | Status |
|---|---|---|---|---|
| 1 | MongoDB credentials exposed in reflection doc | 🔴 Critical | `day_30_reflection.md` | ✅ Removed (never committed) |
| 2 | RBAC allows user self-promotion to ADMIN | 🔴 Critical | Day 29 | ✅ Fixed + tested |
| 3 | Real `.env` files committed to git | 🔴 Critical | Days 28, 29 | ➖ Incorrect — never committed |
| 4 | `shared/` directory is completely empty | 🟠 High | `shared/` | ✅ `@restful/shared` package |
| 5 | No test files (0%) | 🟠 High | Entire repo | ✅ 447 tests, coverage gates in CI |
| 6 | `PrismaClient` instantiated per controller | 🟠 High | Days 27–29 | ✅ Per-demo singleton |
| 7 | Missing `try/catch` in controller async ops | 🟠 High | Days 26–30 | ✅ `asyncHandler` + `errorHandler` |
| 8 | `(req as any).user` — type safety bypassed | 🟡 Medium | Days 28, 29 | ✅ Typed augmentation + guard |
| 9 | JWT secret defined twice with different fallbacks | 🟡 Medium | Day 28 | ✅ Single source, no fallback |
| 10 | CI/CD pipeline broken (no `turbo.json`) | 🟡 Medium | `.github/workflows` | ✅ Green on GitHub ([run](https://github.com/OdeToTheWind/restful-api-design-patterns/actions/runs/37802119044)) |
| 11 | `code.text` scratch file in repo | 🟡 Medium | Day 28 | ✅ Deleted |
| 12 | No Zod validation on auth routes | 🟡 Medium | Days 28, 29 | ✅ Fixed (also Days 26, 27) |
| 13 | No rate limiting on auth endpoints | 🟡 Medium | Days 28, 29 | ✅ Fixed + tested |
| 14 | README progress table not updated after Day 25 | 🟢 Low | `README.md` | ✅ Updated |
| 15 | `system_design.md` is a stub | 🟢 Low | `docs/architecture/` | ✅ 31 ADRs |
| 16 | Empty `lib/` folder (Day 28) | 🟢 Low | Day 28 | ✅ Holds Prisma singleton |
| 17 | Empty `advanced/` and `real-world/` folders | 🟢 Low | `demos/` | ➖ Expected — future phases |

### Found During Re-verification (October 7–8)

| # | Issue | Severity | Location | Status |
|---|---|---|---|---|
| 18 | All 30 `tsconfig.json` fail to compile (`TS5110`) | 🔴 Critical | Every demo | ✅ `Node16` module + resolution |
| 19 | Mass assignment — `role` (any field) settable | 🟠 High | Day 27 users API | ✅ Zod whitelist |
| 20 | No JSON 404 / error handler (Express HTML errors) | 🟠 High | Days 26–30 | ✅ Fixed |
| 21 | All user emails visible to any logged-in user | 🟠 High | Day 29 `GET /users` | ✅ ADMIN/MODERATOR only |
| 22 | Local Node 16 (EOL); CI on Node 20/24 | 🟡 Medium | Dev environment | ✅ `.nvmrc` + nvm default → 22 |
| 23 | Login timing reveals registered emails | 🟡 Medium | Days 28, 29 | ✅ Dummy-hash comparison + test |
| 24 | Previous plan marked unfinished work as "Implemented ✅" | 🟡 Medium | This report | ✅ Corrected |
| 25 | JWT valid 24h with no refresh/revocation | 🟡 Medium | Days 28, 29 | ✅ 15-min access + rotating refresh tokens |
| 26 | `node_modules/` committed to git | 🟡 Medium | Repo root | ✅ Untracked + ignored |
| 27 | README marked Days 31–40 as Completed (they didn't exist) | 🟡 Medium | `README.md` | ✅ Corrected (since built) |
| 28 | Runtime upload image would have been committed | 🟢 Low | Day 21 `uploads/` | ✅ Contents git-ignored |
| 29 | No request ids / structured logs (`console.error`) | 🟢 Low | Days 26–30 | ✅ Winston + `X-Request-Id` via shared |
| 30 | Login throttled per IP only (credential stuffing across IPs) | 🟡 Medium | Days 28, 29 | ✅ Per-account limiter on failed logins |
| 31 | No health/readiness probes or graceful shutdown | 🟡 Medium | Days 26–30 | ✅ `healthRouter` + `startServer` |
| 32 | Route params/query not validated | 🟢 Low | Days 26, 27 | ✅ `validateParams` (`validateQuery` available) |
| 33 | No formatting standard (mixed quote styles) | 🟢 Low | Intermediate code | ✅ Prettier + `.editorconfig` + CI check |

### Found During the Day-50 Re-audit (October 8)

| # | Issue | Severity | Location | Status |
|---|---|---|---|---|
| 34 | Dead-letter admin endpoints have no auth; list exposes recipient emails, retry re-sends mail | 🟠 High | Day 40 `app.ts` | ✅ Fixed (`routes/admin.routes.ts`, `X-Admin-Key` + timing-safe guard, tests, OpenAPI) |
| 35 | `POST /api/files/cleanup-abandoned` deletes S3 objects + rows with no auth | 🟠 High | Day 39 | ✅ Fixed (HTTP route removed; `src/cleanup.ts` single entry point) |
| 36 | Path traversal: `DELETE /api/assets/..%2F..%2F<file>` deletes outside `uploads/` | 🟠 High | Day 22 `asset.controller.ts` | ✅ Fixed (`path.basename` + directory bounds check) |
| 37 | CI matrix and `engines` still target Node 20 (end-of-life April 30, 2026); `@types/node` ^20 | 🟡 Medium | CI, `package.json` | ✅ Fixed (Node 22/24 matrix, engines >=22, @types/node ^22) |
| 38 | Every core dependency is a major behind (Express 4, Zod 3, Prisma 5, Jest 29) and Dependabot ignores all majors, so nothing will ever surface them | 🟡 Medium | Workspace | ✅ Planned in ADR-032 (preserve snapshots 1–50, upgrade template for Advanced) |
| 39 | Beginner phase has 0 tests and is outside ESLint, so bugs like #36 go unnoticed | 🟢 Low | `demos/beginner/` | ✅ Fixed (`scripts/smoke/beginner-smoke.sh` validates all 25 demos in CI) |
| 40 | Smoke-test "parallelized CI steps" claim was false (one job, sequential) | 🟡 Medium | This report | ✅ Corrected |
| 41 | `TRUST_PROXY` defaults to `true` while the API port is also published; Caddy binds all interfaces; debug `/api/proxy-info` in prod image | 🟡 Medium | Day 46 | ✅ Fixed (TRUST_PROXY default false, Caddy 127.0.0.1, /api/proxy-info gated) |
| 42 | Only code demo with OpenAPI docs but no contract test | 🟢 Low | Day 46 | ✅ Fixed (OpenAPI contract matcher asserted in `items.test.ts`) |
| 43 | `collectCoverageFrom` excludes `src/config/**` — 3 of Day 49's 6 source files, i.e. the lesson itself | 🟢 Low | Day 49 `jest.config.js` (pattern from template) | ✅ Fixed (included `src/config/**` in template & Day 49; 100% coverage) |
| 44 | Each smoke phase starts all 6 containers; `pnpm smoke` boots the stack 3×; Day 28 check lives in Phase 3 | 🟢 Low | `scripts/smoke/` | ✅ Fixed (`start_infrastructure` accepts service list; Day 28 check in Phase 1) |
| 45 | Private local maintenance note committed to the repo root, contradicting the attribution policy | 🟡 Medium | Repo root (added in #9) | ✅ Fixed (untracked from git, added to `.git/info/exclude`) |
| 46 | Day 39 cleanup logic duplicated in controller and `src/cleanup.ts` | 🟢 Low | Day 39 | ✅ Fixed (unified into `src/cleanup.ts`) |
| 47 | Planned Days 55, 56, 58, 59, 64, 66, 69 (and partly 65) repeat Days 34, 26+, 40, 50, 49, 31, 41, 42 | 🟡 Medium | Roadmap | ✅ Fixed (re-scoped topics in README roadmap) |
| 48 | No README in 23 of 24 intermediate demos; Days 28 and 29 share port 3028 | 🟢 Low | `demos/intermediate/` | ✅ Fixed (READMEs added for all 24 demos; Day 29 assigned port 3029) |
| 49 | Stale numbers: dependabot "31 packages", CI "Days 26–43", Day 47 README "300+ tests", template README `new-day 50` example, `author: "Bhargavi"` | 🟢 Low | Configs, Day 47 | ✅ Fixed (updated configs, counts, template example, author: "Bhargavi Badal") |
| 50 | This report contradicted itself (ADR count, tree, test totals, closing actions, CI link) | 🟢 Low | `assessment.md` | ✅ Corrected |
| 51 | README listed unused tools and unbuilt features as current; setup steps incomplete | 🟢 Low | `README.md` | ✅ Corrected |
| 52 | Days 31–50 reflections all dated Oct 8, uniform polished voice, little personal struggle | 🟡 Medium | `docs/progress/day_31–50` | ❌ Open — personal edit needed |

**Totals:** 52 issues · 49 ✅ fixed · 2 ➖ not an issue · 1 ❌ open (#52 personal edit).

---

## 8. Implementation Log (Remediation Pass)

### Why This Order?

| # | Area | Why This Rank |
|---|---|---|
| **1** | 🔴 Security | Leaks and privilege-escalation bugs come before everything else. Every later step would otherwise build on top of them. |
| **2** | 🟠 Code Quality (Intermediate) | Days 26–30 are the template for every future demo. Fix async errors, the singleton and validation before they get copied forward. |
| **3** | 🟡 TypeScript Discipline | `tsc` was broken everywhere. Nothing (build, tests, CI) can be trusted until the compiler is green and `any` is removed. |
| **4** | 🟢 Monorepo Config | Once code is typed and correct, extract the duplicated pieces into `shared/` and wire up a real workspace + CI. |
| **5** | 🔵 Testing | Tests lock in Steps 1–4. They need the Prisma singleton (Step 2, so it can be mocked) and the workspace (Step 4, so CI can run them). |

### Verified State Before This Pass

An earlier version of this plan marked Steps 1–4 as "Implemented ✅". A file-by-file check showed:

| Claim in previous plan | Reality |
|---|---|
| MongoDB credential removed | ✅ True — and never in git history |
| `.env` files untracked from git | ✅ Never committed. No rotation needed |
| RBAC self-promotion fixed | ✅ Day 29 `/register` · ❌ Day 27 still had mass assignment |
| All async controllers wrapped | ❌ Only the Day 28/29 auth controllers |
| Prisma singleton | ❌ Day 29 created two clients; Day 28 `lib/` empty |
| JWT secret consolidated | ⚠️ Hardcoded fallback secret still committed |
| `(req as any).user` removed | ❌ Still in `/me` routes (Days 28, 29) |
| `ApiResponse` typed | ❌ `res: any, data: any` in all 5 intermediate demos |
| `shared/`, workspace, CI fixed | ❌ None existed |

### Steps 1–5 ✅

- **Security:** no secrets in history; no `JWT_SECRET` fallbacks; `.env.example` files; Day 27 mass assignment fixed; Zod on auth; auth rate limits; 10 kb JSON limit; Day 29 user list restricted.
- **Code quality:** `asyncHandler` everywhere; global error + JSON 404 handlers; DB errors mapped to HTTP codes; Prisma singleton; Day 26 connects before `listen()`; Day 30 handler ordering; scratch file deleted.
- **TypeScript:** all 30 tsconfigs fixed; no `(req as any).user`; typed `ApiResponse`; typed JWT payload + guard; ESLint `no-explicit-any: error`.
- **Monorepo:** pnpm workspace + `@restful/shared`; one lockfile; root `build`/`lint`/`test`/`verify`; CI rewritten; `.nvmrc` → 22.
- **Testing:** Jest + ts-jest + Supertest; 67 tests at the end of pass 1 (447 now); tests in CI on every push.

### Results — then and now

| Check | Pass 1 (Oct 7) | Re-audit (Oct 8) |
|---|---|---|
| `pnpm install --frozen-lockfile` | ✅ | ✅ 51 packages |
| `pnpm audit --prod --audit-level high` | — | ✅ 0 known vulnerabilities |
| `pnpm build` | ✅ 31 packages, 0 errors | ✅ 0 errors |
| `pnpm lint` / `format:check` | ✅ | ✅ |
| `pnpm test:coverage` | ✅ 67 tests | ✅ 447 tests, every gate met (lowest: Day 44 branches 71%) |
| `pnpm smoke` | — | ✅ 212 checks, 0 failures |
| `pnpm test:integration` | — | ✅ 6 Testcontainers tests |

### Behaviour Changes Worth Knowing

- JWT demos **refuse to start without `JWT_SECRET`** — copy `.env.example` to `.env`.
- Day 29 `GET /api/users` is `ADMIN`/`MODERATOR` only.
- Passwords must be 8–72 characters on register, and emails are lowercased.
- Auth endpoints return `429` after 10 attempts per 15 minutes per IP.
- Error responses are always JSON (`{ success: false, message, errors, timestamp }`).
- Prisma clients are generated to `<demo>/generated/prisma` (git-ignored). Import from `src/lib/prisma.ts`, not `@prisma/client`.
- Use Node 22 locally.

---

## 9. Next Steps

Only pending work is listed here. Completed work is recorded in the [issue tracker](#7-identified-flaws--issues--status-tracker).

#### 🔴 Fix now (security, #34–#36)

- [x] **Day 40:** move the dead-letter routes into `routes/` + a controller, and put them behind an admin check (Day 49's `X-Admin-Key` + `timingSafeEqual`, or JWT + RBAC). Add 401/403 tests and update the OpenAPI security scheme.
- [x] **Day 39:** delete `POST /api/files/cleanup-abandoned` and keep `src/cleanup.ts` as the only entry point (cron / `pnpm cleanup`). If the endpoint stays, protect it and have it call `runCleanup()`.
- [x] **Day 22:** `path.basename` the filename and reject anything that resolves outside `uploads/`, with a comment marking it as a post-snapshot fix.

#### 🟠 Before Day 51

- [x] **Remove the private maintenance note from git** (#45): `git rm --cached <file>`, then add it to `.git/info/exclude` as was done for the local instruction file.
- [x] **Node 20 → 22/24** (#37): CI matrix `[22.x, 24.x]`, `engines: ">=22"`, `@types/node` ^22, README badge.
- [x] **Plan the major upgrades** (#38): Express 5, Zod 4, Prisma 6+, Jest 30. Either do one deliberate upgrade day, or start the advanced phase on the new majors in `demos/_template` and leave Days 1–50 as snapshots. Record the choice in an ADR (ADR-032).
- [x] **Re-scope the advanced roadmap** (#47) the way Days 44/45/47 were. For example: 55 → distributed tracing context propagation; 56 → CSP for Swagger UI + security.txt; 58 → scheduled/repeatable jobs + flows; 59 → sagas/outbox; 64 → gradual rollouts; 66 → API linting (Spectral) + breaking-change detection; 69 → outgoing webhooks with retries.
- [x] **Day 46 hardening** (#41, #42): `TRUST_PROXY` default `false` (set in compose); bind Caddy to `127.0.0.1`; gate `/api/proxy-info`; add the contract test.
- [x] **Template coverage scope** (#43): stop excluding `src/config/**` (keep excluding `src/lib/prisma.ts`) so configuration logic counts.
- [x] **Smoke phases** (#44): give `start_infrastructure` a list of needed services; move the Day 28 secret check into Phase 1. Optionally run the phases as a CI matrix so they really run in parallel.
- [x] **Refresh stale numbers** (#49): dependabot comment, CI smoke comment, Day 47 README, `author: "Bhargavi Badal"`.

#### 🟢 Ongoing

- [ ] **Make the Days 31–50 reflections mine** (#52): for each, add a short "What tripped me up" and "What I'd do differently" in my own words, and correct the date if the work spanned more than one day. From Day 51, write the reflection before polishing the code.
- [x] **Beginner smoke check** (#39): start each beginner demo and hit one endpoint in CI, so a broken snapshot is at least noticed (`scripts/smoke/beginner-smoke.sh`).
- [x] **Add a short README per intermediate demo** (#48): purpose, services needed, port, `pnpm dev`, link to the reflection. Give Day 29 its own port (3029).
- [ ] **Keep the pace honest:** one day per day keeps the "100 days" framing true. Days 31–50 landed in one sitting.
- [ ] **MongoDB Atlas user (password lost):** reset it in Atlas → Database Access → Edit Password, or delete the user if the cluster isn't used. Optional: the credential was never committed.

---

## 10. Strategic Roadmap (Days 31–100)

### Days 31–50 — Delivered

| Day | Topic | Key Goal | Status |
|---|---|---|---|
| 31 | Swagger / OpenAPI Docs → **Spec-first** | Contract first; validation, docs and a typed client generated from it | ✅ |
| 32 | Advanced Pagination + Filtering | Offset + keyset pagination, whitelisted sort, filters | ✅ |
| 33 | Redis Caching | Cache-aside, invalidation, graceful fallback | ✅ |
| 34 | Winston Logging → **Log context** | Request context in every log line, redaction, per-environment levels | ✅ |
| 35 | DB Seeding + Migrations | Deterministic, idempotent seeds; `db:reset` | ✅ |
| 36 | Soft Delete Pattern | `deletedAt`, central filtering, restore, partial unique index | ✅ |
| 37 | Repository + Service Layer | Rules in services, storage behind interfaces, DI | ✅ |
| 38 | DTOs + Mappers | Explicit per-audience views | ✅ |
| 39 | File Upload to Cloud | S3-compatible storage (SeaweedFS locally), pre-signed URLs, cleanup | ✅ |
| 40 | Email Notifications | BullMQ + retries + Mailpit + dead-letter endpoints | ✅ |
| 41 | Webhook Endpoints | Receive + validate signed (HMAC) webhooks, exactly-once | ✅ |
| 42 | API Versioning (URI) | `/v1/`, `/v2/`, Deprecation/Sunset headers, 410 after sunset | ✅ |
| 43 | Custom Auth Middleware → **Sessions** | httpOnly cookie refresh tokens, CSRF, list/revoke sessions | ✅ |
| 44 | Unit Testing → **Test Doubles & Coverage** | Mocks vs stubs vs fakes; what coverage proves | ✅ |
| 45 | Integration Testing → **Testcontainers** | Real PostgreSQL per test run, real migrations | ✅ |
| 46 | Docker Containerization | Multi-stage non-root image; compose with migrate job, health checks, Caddy TLS | ✅ |
| 47 | GitHub Actions CI → **Pipeline Hardening** | Coverage reports, Docker job, GHCR publish, concurrency, least privilege | ✅ |
| 48 | DB Relationships | One-to-many, many-to-many with Prisma; N+1 | ✅ |
| 49 | Environment Configs | Layered `.env`, Zod schema with production rules, typed config | ✅ |
| 50 | DB Transactions | `$transaction`; Serializable + retry; optimistic concurrency | ✅ |

### Days 51–75 (Advanced) — Re-scoping Needed

These planned days overlap work that is already done:

| Planned day | Already covered by | Suggested re-scope |
|---|---|---|
| 55 Structured logging + correlation IDs | Day 34 + `@restful/shared` | Trace-context propagation across services (W3C `traceparent`) |
| 56 Helmet + CSP | helmet on every demo since Day 26 | A strict CSP that still allows Swagger UI; `security.txt`; header tests |
| 58 BullMQ background jobs | Day 40 | Repeatable/scheduled jobs, flows, rate-limited queues |
| 59 Advanced transactions | Day 50 | Saga + transactional outbox across two services |
| 64 Feature flags | Day 49 | Percentage rollouts, per-user targeting, kill switches |
| 65 Header versioning | Day 42 (URI) | Content negotiation (`Accept: application/vnd...`) — keep, but compare with Day 42 |
| 66 OpenAPI spec-driven | Day 31 | API linting (Spectral) + breaking-change detection in CI |
| 69 Event-driven webhooks | Day 41 (receiving) | Sending webhooks: retries, signing, a delivery log |

Still-unique topics not to skip:

| Priority | Topic | Why Important |
|---|---|---|
| 🔴 Must-do | HATEOAS (Day 51) | Defines true REST maturity (Level 3) |
| 🔴 Must-do | Clean Architecture (Day 68) | Ties together everything learned |
| 🔴 Must-do | Circuit Breaker (Day 72) | Critical resilience pattern |
| 🟠 High | Distributed rate limiting with Redis (Day 53) | The Day 28/29 limiter is per-process |
| 🟠 High | OpenTelemetry / Tracing (Day 75) | Essential for production debugging |
| 🟡 Nice | GraphQL Comparison (Day 74) | Perspective-building; not a replacement |

### Days 76–100 (Real-World) — Recommended Execution Order

Build real-world apps from the most foundational to the most complex:

```
Day 76  → E-commerce API (most common; tests all patterns)
Day 77  → Blog CMS (content + media + search)
Day 82  → Expense Tracker (financial precision, transactions)
Day 79  → Task Management / Trello-like (real-time, webhooks)
Day 91  → SaaS Multi-Tenant CRM (hardest; do last in phase)
Day 100 → Capstone: Production Master API
```

---

## 11. Closing Assessment

This is a **strong learning project** in execution. The reflection per day, the consistent structure, and the deliberate progression from basics to complexity show serious intent. The tooling is now the strongest part of the repository:
- 447 tests with coverage gates;
- OpenAPI contract tests on 23 of 24 code demos;
- 212 checks against real infrastructure;
- a production image tested and published from CI;
- branch protection on `main`.

The original report named the empty `shared/` directory as the biggest risk, and that risk is gone. The re-audit shows where the risk moved: **to whatever the automation doesn't check**.
- Three unprotected endpoints passed every gate, because no test asked "who is allowed to call this?"
- A beginner traversal bug sits outside lint and tests by design.
- The documents drifted from the code until this report contradicted itself.

The fixes are small. The habits matter more:
- Add an authorization test to every new endpoint.
- Re-run this kind of audit at each phase boundary.
- Keep the reflections personal.

At one day per day, the remaining 50 put **Day 100 around late November 2026**. Fix #34–#36, re-scope the advanced roadmap and upgrade the stack before Day 51. With that done, the project will fulfil its promise as a portfolio-quality, production-grade learning resource.

---

*Report generated on October 7, 2026, and re-audited on October 8, 2026 after Day 50. Every status above was checked against the working tree, git history, a full CI-equivalent run (`pnpm install --frozen-lockfile`, `audit`, `build`, `lint`, `format:check`, `test:coverage`), `pnpm smoke`, `pnpm test:integration`, branch-protection settings and GitHub Actions.*
