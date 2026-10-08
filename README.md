# RESTful API Design Patterns

[![GitHub Repo](https://img.shields.io/badge/GitHub-OdeToTheWind%2Frestful--api--design--patterns-blue?style=for-the-badge&logo=github)](https://github.com/OdeToTheWind/restful-api-design-patterns)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-orange?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com)
[![CI/CD](https://github.com/OdeToTheWind/restful-api-design-patterns/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/OdeToTheWind/restful-api-design-patterns/actions/workflows/ci-cd.yml)

**100 Days of Professional RESTful API Design Practice** — A structured learning journey from basic CRUD to production-grade, scalable, event-driven APIs.

---

## Overview

This repository contains **100 progressive demos** focused purely on mastering **RESTful API Design Patterns** using Node.js + TypeScript.

- **Beginner (Days 1–25)**: Core REST principles, HTTP semantics, basic Express patterns.
- **Intermediate (Days 26–50)**: Databases, auth, validation, testing, Docker, and layered architecture.
- **Advanced (Days 51–75)**: HATEOAS, caching, observability, resilience, clean architecture.
- **Real-World (Days 76–100)**: Complete production applications integrating all learned patterns.

Built with **TypeScript**, **Node.js**, modern tools, and a clean monorepo structure using workspaces.

---

## Why This Project?

- Master **RESTful API design** through deliberate practice across 100 real-world scenarios.
- Learn progressive complexity — from simple routes to enterprise-grade architectures.
- Showcase production-ready patterns: versioning, idempotency, soft deletes, audit logs, distributed tracing, and more.
- Provide reusable **shared** middleware, utilities, types, and architectural decisions for any future API project.
- Serve as a living portfolio and learning resource for developers aiming to build scalable backends.

Whether you're a beginner solidifying fundamentals or an experienced engineer refining advanced patterns, this repo offers structured, documented, and runnable demos.

---

## Project Structure

```bash
├── .github
│   ├── workflows/ci-cd.yml     # install → audit → build → lint → test (with coverage)
│   └── dependabot.yml          # weekly grouped dependency updates
├── docs
│   ├── progress/
│   │   ├── day_01_reflection.md  # Reflection log for each day
│   │   └── ...
│   └── architecture/
│       └── system_design.md    # Shared patterns & architecture decisions (ADRs)
├── LICENSE
├── package.json                # Workspace root (build / lint / test / verify scripts)
├── pnpm-workspace.yaml         # shared + demos/*/* + demos/_template
├── eslint.config.mjs
├── .prettierrc.json            # formatting (pnpm format / format:check)
├── .editorconfig
├── .nvmrc                      # Node 22
├── README.md                   # This file — main roadmap & progress tracker
├── assessment.md               # Code-quality assessment, issue tracker & next steps
├── docker/
│   └── demo.Dockerfile         # Production image for any demo (Day 46)
├── scripts/
│   ├── new-day.mjs             # Scaffold a new day from demos/_template (pnpm new-day)
│   ├── smoke-test.sh           # Runs every smoke phase (pnpm smoke)
│   ├── smoke/                  # common.sh + phase-1-core / phase-2-services / phase-3-advanced
│   └── coverage-summary.mjs    # Coverage table for the CI job summary
├── demos/
│   ├── _template/              # Copy this to start a new day
│   ├── beginner/               # Demos 01–25 (standalone lesson snapshots)
│   ├── intermediate/           # Demos 26–50
│   ├── advanced/               # Demos 51–75 (not started)
│   └── real-world/             # Demos 76–100 (not started)
└── shared/                     # @restful/shared — used by Day 26 onward
    └── src/                    # ApiResponse, AppError, asyncHandler, errorHandler, notFoundHandler,
                                # validateBody/Query/Params, logger (request context + redaction),
                                # requestId, requestLogger, healthRouter, startServer, docsRouter (OpenAPI),
                                # pagination helpers, loadEnv/envFields, createContractMatcher (testing),
                                # typed req.user / req.id
```
---
## Daily Progress

| Day | Topic / Demo                                      | Status          | Key Learnings / Deliverables |
|-----|---------------------------------------------------|-----------------|------------------------------|
| 01  | Basic Express Server                      | ✅ Completed      | Express server setup, first GET endpoint, basic routing, nodemon, TypeScript config |
| 02  | Routing Controllers                       | ✅ Completed      | Controller pattern, route organization, separation of concerns |
| 03  | Todo Crud Inmemory                        | ✅ Completed      | Full CRUD operations with in-memory array, proper HTTP methods |
| 04  | Product Catalog Crud                      | ✅ Completed      | Resource modeling (products), REST resource design principles |
| 05  | User Management Basic                     | ✅ Completed      | User resource design, basic CRUD best practices |
| 06  | HTTP Methods Best Practices               | ✅ Completed      | Correct usage of GET, POST, PUT, DELETE, safety & idempotency |
| 07  | Status Codes Mastery                      | ✅ Completed      | Semantic HTTP status codes (2xx, 3xx, 4xx, 5xx) |
| 08  | Query Parameters Filtering                | ✅ Completed      | Query params for filtering, `req.query` handling |
| 09  | Path Parameters Nesting                   | ✅ Completed      | Path parameters, basic nested routes |
| 10  | Error Handling Intro                      | ✅ Completed      | Custom error responses, try-catch basics |
| 11  | Middleware Basics                         | ✅ Completed      | Request/response middleware, logging middleware |
| 12  | Cors Environment Setup                    | ✅ Completed      | CORS configuration, dotenv setup, environment variables |
| 13  | Input Validation Basic                    | ✅ Completed      | Basic input validation, sanitization |
| 14  | Logging Setup                             | ✅ Completed      | Structured logging introduction |
| 15  | Pagination Intro                          | ✅ Completed      | Basic pagination (limit/offset or page/size) |
| 16  | Sorting Filtering Advanced Basics         | ✅ Completed      | Sorting & advanced query parameter handling |
| 17  | Nested Resources Posts Comments           | ✅ Completed      | Nested resources (one-to-many simulation) |
| 18  | Idempotency Put Delete                    | ✅ Completed      | Idempotent operations (PUT, DELETE) |
| 19  | Patch Partial Updates                     | ✅ Completed      | PATCH method, partial resource updates |
| 20  | Response Formatting                       | ✅ Completed      | Consistent API response wrapper |
| 21  | File Upload Multer Basic                  | ✅ Completed      | File upload handling with Multer |
| 22  | Static Assets API                         | ✅ Completed      | Serving static files via API |
| 23  | Bulk Operations Intro                     | ✅ Completed      | Bulk create/update operations |
| 24  | Simple Rate Limiting                      | ✅ Completed      | Basic rate limiting implementation |
| 25  | MVC Refactor                              | ✅ Completed      | MVC architecture refactoring |
| 26  | MongoDB Mongoose TODOS                    | ✅ Completed      | MongoDB + Mongoose, schemas, ODM CRUD |
| 27  | Postgres Prisma Users                     | ✅ Completed      | PostgreSQL + Prisma, migrations, type-safe queries |
| 28  | JWT Authentication                        | ✅ Completed      | JWT + bcrypt auth; 15-min access tokens + rotating, hashed refresh tokens |
| 29  | RBAC Roles Permissions                    | ✅ Completed      | Role-Based Access Control (RBAC); OpenAPI 3.1 docs + Swagger UI at `/api/docs` |
| 30  | Global Error Middleware                   | ✅ Completed      | Centralized error handling (graduated into `@restful/shared`) |
| 31  | Swagger OpenAPI Docs                      | ✅ Completed      | Spec-first contract → validation, OpenAPI 3.1, Swagger UI and a generated typed client; drift check in CI |
| 32  | Advanced Pagination Filter Sort           | ✅ Completed      | Offset + cursor (keyset) pagination, whitelisted sorting, filters, matching indexes |
| 33  | Caching Redis Intro                       | ✅ Completed      | Redis cache-aside, write invalidation with list versioning, `X-Cache`, graceful fallback when Redis is down |
| 34  | Log Context                               | ✅ Completed      | AsyncLocalStorage request context in every log line, automatic secret redaction, per-environment levels |
| 35  | Seeding Migrations                        | ✅ Completed      | Deterministic, idempotent Prisma seeds with profiles; `db:reset`; snapshot-tested seed data |
| 36  | Soft Delete                               | ✅ Completed      | Prisma client extension (reads hide deleted rows, delete → trash), restore, partial unique index |
| 37  | Repository Service Layer                  | ✅ Completed      | Controller → service → repository, injected dependencies, in-memory repository for tests |
| 38  | DTOs Mappers                              | ✅ Completed      | Public / private / admin views via explicit mappers; input DTOs; leaks caught by contract tests |
| 39  | File Upload Cloud Storage                 | ✅ Completed      | Pre-signed S3 URLs (SeaweedFS locally), direct-to-storage uploads verified with HeadObject |
| 40  | Email Notifications Queue                 | ✅ Completed      | BullMQ worker, 202 Accepted + status URL, retries with backoff, idempotency keys, Mailpit |
| 41  | Webhook Endpoints                         | ✅ Completed      | HMAC signatures over the raw body, replay protection, exactly-once processing |
| 42  | API Versioning (URI)                      | ✅ Completed      | v1/v2 side by side, Deprecation/Sunset/Link headers, 410 after sunset, docs per version |
| 43  | Cookie-based Sessions                     | ✅ Completed      | Refresh token in httpOnly SameSite cookie, double-submit CSRF, list/revoke sessions |
| 44  | Test Doubles and Coverage                 | ✅ Completed      | Dummy/stub/spy/mock/fake on a checkout with compensation; why coverage isn't correctness |
| 45  | Integration Testing (Testcontainers)      | ✅ Completed      | Real PostgreSQL per test run: migrations, constraints, array queries, GIN index |
| 46  | Docker Containerization                   | ✅ Completed      | Multi-stage non-root image via `pnpm deploy`; compose stack with migrate job and health checks |
| 47  | GitHub Actions CI                         | ✅ Completed      | Concurrency, least privilege, coverage summary + artifacts, real-DB and Docker jobs |
| 48  | Database Relationships                    | ✅ Completed      | 1:N, M:N (explicit + implicit), nested writes, N+1 made visible with an operation counter |
| 49  | Environment Configs                       | ✅ Completed      | Layered `.env` files, one Zod schema with production rules, typed config, feature flags, redaction |
| 50  | Database Transactions                     | ✅ Completed      | Atomic transfers, Serializable + retry, idempotency keys, optimistic locking (ETag/If-Match) |
| 51  | demo-51-hateoas-links                             | 📋 Planned      | HATEOAS – Hypermedia as the Engine of Application State |
| 52  | demo-52-redis-caching-advanced                    | 📋 Planned      | Advanced Redis caching & invalidation |
| 53  | demo-53-rate-limiting-redis                       | 📋 Planned      | Distributed rate limiting with Redis |
| 54  | demo-54-observability-prometheus                  | 📋 Planned      | Prometheus metrics & monitoring |
| 55  | demo-55-trace-context-propagation                 | 📋 Planned      | Distributed trace-context propagation (W3C traceparent) across microservices |
| 56  | demo-56-strict-csp-security-txt                   | 📋 Planned      | Strict CSP with Swagger UI support, security.txt (RFC 9116), security header suite |
| 57  | demo-57-input-sanitization-xss                    | 📋 Planned      | Advanced input sanitization & XSS protection |
| 58  | demo-58-repeatable-jobs-flows                     | 📋 Planned      | Repeatable & scheduled BullMQ jobs, parent-child job flows, rate-limited queues |
| 59  | demo-59-saga-transactional-outbox                 | 📋 Planned      | Distributed transactions: Saga orchestrator + Transactional Outbox pattern |
| 60  | demo-60-cqrs-simulation                           | 📋 Planned      | CQRS pattern simulation |
| 61  | demo-61-microservices-rest-comms                  | 📋 Planned      | Inter-service communication |
| 62  | demo-62-contract-testing                          | 📋 Planned      | Contract testing with Pact |
| 63  | demo-63-performance-profiling                     | 📋 Planned      | API performance profiling |
| 64  | demo-64-gradual-rollouts-flags                    | 📋 Planned      | Dynamic feature flags: percentage rollouts, user targeting, emergency kill switches |
| 65  | demo-65-content-negotiation-versioning            | 📋 Planned      | Content negotiation (`Accept: application/vnd...`) versioning vs URI versioning |
| 66  | demo-66-spectral-linting-breaking-changes         | 📋 Planned      | Automated API linting with Spectral and breaking-change detection in CI |
| 67  | demo-67-server-sent-events-polling                | 📋 Planned      | Real-time updates with SSE |
| 68  | demo-68-clean-architecture                        | 📋 Planned      | Clean Architecture (ports & adapters) |
| 69  | demo-69-outgoing-webhooks-delivery                | 📋 Planned      | Outbound webhook dispatcher: HMAC signing, retry backoff, delivery logs & dead-letters |
| 70  | demo-70-multi-tenancy-basics                      | 📋 Planned      | Multi-tenancy data isolation |
| 71  | demo-71-internationalization-i18n                 | 📋 Planned      | i18n support in responses |
| 72  | demo-72-circuit-breaker-resilience                | 📋 Planned      | Circuit breaker pattern |
| 73  | demo-73-api-gateway-pattern                       | 📋 Planned      | API Gateway implementation |
| 74  | demo-74-graphql-comparison-rest                   | 📋 Planned      | Deep comparison of REST vs GraphQL patterns |
| 75  | demo-75-full-observability-tracing                | 📋 Planned      | OpenTelemetry distributed tracing |
| 76  | demo-76-ecommerce-api                             | 📋 Planned      | Full e-commerce API (products, cart, orders) |
| 77  | demo-77-blog-cms-backend                          | 📋 Planned      | Blog CMS with posts, categories, comments |
| 78  | demo-78-social-media-api                          | 📋 Planned      | Social media backend (posts, feed, follows) |
| 79  | demo-79-task-management-trello-like               | 📋 Planned      | Trello-like task management system |
| 80  | demo-80-booking-system                            | 📋 Planned      | Reservation & booking system |
| 81  | demo-81-lms-education                             | 📋 Planned      | Learning Management System backend |
| 82  | demo-82-expense-tracker                           | 📋 Planned      | Personal finance & expense tracker |
| 83  | demo-83-inventory-management                      | 📋 Planned      | Inventory & warehouse management |
| 84  | demo-84-support-ticket-system                     | 📋 Planned      | Helpdesk ticket management system |
| 85  | demo-85-food-delivery-api                         | 📋 Planned      | Food delivery platform API |
| 86  | demo-86-job-portal-backend                        | 📋 Planned      | Job board & application system |
| 87  | demo-87-real-estate-listings                      | 📋 Planned      | Real estate listing & search API |
| 88  | demo-88-forum-discussion-api                      | 📋 Planned      | Discussion forum with moderation |
| 89  | demo-89-notification-service-full                 | 📋 Planned      | Complete notification system |
| 90  | demo-90-analytics-backend                         | 📋 Planned      | Analytics & reporting backend |
| 91  | demo-91-saas-multi-tenant-crm                     | 📋 Planned      | Multi-tenant SaaS CRM |
| 92  | demo-92-marketplace-api                           | 📋 Planned      | Marketplace platform (sellers + buyers) |
| 93  | demo-93-event-ticketing-system                    | 📋 Planned      | Event ticketing & management |
| 94  | demo-94-library-management                        | 📋 Planned      | Library book management system |
| 95  | demo-95-iot-device-api                            | 📋 Planned      | IoT device telemetry API |
| 96  | demo-96-fitness-tracker                           | 📋 Planned      | Fitness & workout tracking API |
| 97  | demo-97-payment-gateway-integration               | 📋 Planned      | Payment gateway + webhook integration |
| 98  | demo-98-content-delivery-api                      | 📋 Planned      | Content delivery with access control |
| 99  | demo-99-enterprise-crm-core                       | 📋 Planned      | Enterprise CRM core features |
| 100 | demo-100-production-grade-master-api              | 📋 Planned      | Capstone: Full production-grade REST API combining all patterns |
---

## Table of Progress

| Level          | Demos   | Focus                                              | Status       |
|----------------|---------|----------------------------------------------------|--------------|
| **Beginner**   | 01–25   | Core REST concepts, HTTP mastery, basic Express | ✅ Completed |
| **Intermediate**| 26–50  | Databases, Auth, Testing, Layered Architecture | ✅ Completed |
| **Advanced**   | 51–75   | Scalability, Observability, Resilience Patterns | ⏳ Planned |
| **Real-World** | 76–100  | Full Production Applications | ⏳ Planned |

**Total Demos**: 100 · **Completed**: 50  
Detailed per-demo docs → [docs/progress/](docs/progress/) · Code-quality review, open issues and next steps → [assessment.md](assessment.md)
---

## Backend Tech Stack

### In use (Days 1–50)

- **Runtime**: Node.js 22+ with TypeScript 5
- **Framework**: Express 4
- **ORM / ODM**: Prisma 5 (PostgreSQL) + Mongoose (MongoDB, Day 26)
- **Validation**: Zod — also the source of the OpenAPI documents
- **Authentication**: JWT + bcrypt, rotating hashed refresh tokens, httpOnly cookie sessions with CSRF (Day 43)
- **Caching**: Redis (Day 33)
- **Background jobs**: BullMQ + Redis, Mailpit for local SMTP (Day 40)
- **Object storage**: S3 API via the AWS SDK, SeaweedFS locally (Day 39)
- **Documentation**: OpenAPI 3.1 + Swagger UI; spec-first contract with a generated typed client (Day 31)
- **Testing**: Jest + Supertest, OpenAPI contract tests, coverage gates, Testcontainers (Day 45), real-infrastructure smoke tests
- **Logging**: Winston via `@restful/shared` — JSON logs, request IDs, request context, secret redaction
- **Containerization**: multi-stage non-root Docker image, Docker Compose, Caddy as a TLS reverse proxy (Day 46)
- **Security**: helmet, CORS allow-list, per-IP + per-account rate limiting, Zod whitelisting, HMAC-signed webhooks

### Planned (Days 51–100)

- **Observability**: OpenTelemetry tracing, Prometheus metrics, Grafana dashboards
- **Messaging**: RabbitMQ / Apache Kafka
- **Frameworks**: a comparison with Fastify / NestJS; GraphQL vs REST (Day 74)
- **Contract testing**: Pact (Day 62)

### Deployment Strategy

- **Local (today)**: Docker Compose per demo — the database plus whatever the demo needs (Redis, S3, Mailpit); Day 46 runs the full stack with a migrate job and Caddy
- **CI/CD (today)**: GitHub Actions — audit, type-check, lint, formatting, tests with coverage, real-infrastructure smoke tests, and a Docker job that publishes the Day 46 image to GitHub Container Registry from `main`
- **Planned**: staging and production deployments (Kubernetes-ready, blue-green / canary) and Prometheus + Grafana + OpenTelemetry monitoring in the advanced and real-world phases

---
## Getting Started

### Prerequisites
- Node.js 22 or higher (`nvm use` picks up `.nvmrc`; Node 20 reached end-of-life in April 2026)
- pnpm 9 (`corepack enable` installs the version pinned in `package.json`)
- Docker & Docker Compose (strongly recommended)
- PostgreSQL, MongoDB, Redis, S3 storage and an SMTP catcher are only needed for the days that use them; each demo's `docker-compose.yml` starts them

### Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OdeToTheWind/restful-api-design-patterns.git
   cd restful-api-design-patterns
   ```

2. **Install dependencies (root workspace)**
   ```bash
   pnpm install        # also builds @restful/shared and generates each demo's Prisma client
   ```

3. **Environment Setup** (per demo)
   ```bash
   cd demos/intermediate/day_29_rbac_roles_permissions
   cp .env.example .env   # set real values; JWT demos refuse to start without JWT_SECRET
   ```

4. **Start the database and run a demo**
   ```bash
   docker compose up -d     # this demo's services (credentials come from .env)
   pnpm prisma:migrate      # apply migrations (Prisma demos)
   pnpm dev                 # Day 29 API docs: http://localhost:3028/api/docs (port comes from .env)
                            # every demo: /health (liveness) and /ready (database check)
   ```

   Services by day: MongoDB (26), PostgreSQL (27–50 except 30, 34, 40, 42, 44, 47, 49), Redis (33, 40), S3-compatible storage (39), Mailpit SMTP (40). Day 46 runs the whole stack in containers: `docker compose up --build --wait`.

   ```bash
   # Day 40 also needs its worker in a second terminal
   pnpm worker
   ```

5. **Workspace checks** (run from the repo root — the same steps as CI)
   ```bash
   pnpm build           # type-checks every demo + shared
   pnpm lint            # ESLint on shared/ and intermediate demos
   pnpm test            # Jest + Supertest (database mocked)
   pnpm test:coverage   # same, with coverage thresholds (CI uses this)
   pnpm format          # Prettier (shared/, intermediate demos, template, configs)
   pnpm verify          # build + lint + format:check + test:coverage
   pnpm smoke           # real Postgres, MongoDB, Redis, S3 storage and SMTP in throwaway containers (needs Docker; run after build)
   pnpm test:integration # Testcontainers suites (needs Docker)
   ```

### Starting a New Day

```bash
pnpm new-day 51 hateoas_links "HATEOAS Links" advanced   # copies demos/_template, renames everything
pnpm install
```

The new demo already includes validation, error handling, request IDs, security headers, health probes, graceful shutdown, validated environment config, OpenAPI docs, a Prisma singleton and tests. See [`demos/_template`](demos/_template/README.md).

Detailed per-day notes are in `docs/progress/day_XX_reflection.md`. Architecture decisions are in [`docs/architecture/system_design.md`](docs/architecture/system_design.md).
---

## Key Features

- **Pure REST-focused learning path** — No frontend bloat, 100% focused on RESTful API design patterns
- **pnpm workspace monorepo** — One install, one lockfile, and a `demos/_template` to start each day from
- **Reusable `@restful/shared` package** — Response envelope, error handling, validation and typed auth context shared by the intermediate+ demos
- **Production-grade patterns implemented step-by-step** — so far: idempotency, soft delete, versioning, RBAC, caching, queues, webhooks, transactions and optimistic locking; HATEOAS, observability and resilience come in the advanced phase
- **CI on every pull request and every push to `main`** — dependency audit, type-check, lint, formatting, tests with coverage gates, OpenAPI contract tests, and a real-database smoke test
- **Progressive learning journey** — Beginner → Intermediate → Advanced → Real-World production applications
- **Comprehensive documentation** — Daily progress logs, OpenAPI specs, and architecture decisions
- **Living Portfolio** — A complete showcase of RESTful API design mastery

---

## Contributing

This is a personal challenge repository, but issues, suggestions, and thoughtful discussions are welcome.

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.