# Day 45 - Real-World Integration Testing with Testcontainers

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Implement true **integration testing against real PostgreSQL** using **Testcontainers**. The integration test suite must spin up disposable Docker database containers on the fly, apply real Prisma migrations, and execute HTTP requests through Express to verify dialect-specific queries, indexes, and constraints that mocks can never catch.

## Key Learnings
- **The Blind Spots of Unit Mocks**: Mocking Prisma methods (`prisma.bookmark.findMany.mockResolvedValue(...)`) tests that code called the ORM, but provides zero guarantee that the SQL query compiles or behaves correctly. Mocks cannot verify PostgreSQL array filtering (`hasEvery`), GIN index performance, native database constraints, or real error code mappings.
- **Bi-Level Testing Strategy**:
  - **Unit Suite (`pnpm test`)**: Instantaneous, runs everywhere without Docker dependencies.
  - **Integration Suite (`pnpm test:integration`)**: Spins up real PostgreSQL via `@testcontainers/postgresql`, runs real migrations, and validates full HTTP request-response cycles.
- **Dynamic Lifecycle Management via Jest `globalSetup`**: A centralized setup file launches the container once per test run, runs `prisma migrate deploy`, and binds the dynamic port connection string to `process.env.DATABASE_URL` before Jest worker processes spawn.
- **Fast Table Truncation Between Tests**: Rather than restarting database containers for each test file (which takes seconds), a `beforeEach` hook executes a fast SQL `TRUNCATE TABLE "Bookmark" CASCADE;` query, ensuring total state isolation in milliseconds.
- **Automated Container Cleanup via Ryuk**: Testcontainers deploys an automated Ryuk reaper container that ensures all spawned database instances and networks are pruned immediately, even if the test suite is aborted with SIGINT.
- **Version Compatibility Across Node LTS**: Testcontainers v12 mandates Node.js ≥ 22.22, which would break CI jobs running Node 20. Pinned to `@testcontainers/postgresql@10.x/11.x` to guarantee reliable operation across all LTS versions.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL 16** (with GIN indexes and text array columns)
- **`@testcontainers/postgresql`** (Docker test orchestration)
- **Jest** + **Supertest**

## Project Structure (Day 45)
```bash
day_45_integration_testing_testcontainers/
├── src/
│   ├── __tests__/
│   │   └── bookmarks.test.ts          # Fast unit tests (mocked Prisma)
│   ├── __integration__/
│   │   └── bookmarks.int.test.ts      # Full HTTP integration tests against real PostgreSQL
│   ├── controllers/bookmark.controller.ts
│   ├── routes/bookmark.routes.ts
│   ├── app.ts
│   └── index.ts
├── integration.global-setup.js        # Starts container and applies migrations
├── integration.global-teardown.js     # Halts container and reclaims resources
├── jest.config.js                     # Config for unit tests (ignores __integration__)
├── jest.integration.config.js         # Dedicated config for integration runner
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/bookmarks?tag=dev&tag=rest` | List bookmarks matching all specified tags (`hasEvery`) | 200 |
| POST | `/api/bookmarks` | Save bookmark (tags deduplicated and normalized) | 201 / 409 |
| DELETE | `/api/bookmarks/:id` | Remove bookmark (tests real P2025 404 mapping) | 204 / 404 |

## Testcontainers Global Setup Script

```javascript
// integration.global-setup.js
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { execSync } = require('node:child_process');

module.exports = async () => {
  console.log('\n🐳 Starting ephemeral PostgreSQL test container...');
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const databaseUrl = container.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  global.__PG_CONTAINER__ = container;

  console.log('🔄 Applying Prisma migrations...');
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
};
```

## How to Run & Verify

```bash
cd demos/intermediate/day_45_integration_testing_testcontainers

# Run unit tests (lightning fast, no Docker required)
pnpm test

# Run real integration tests (requires local Docker daemon)
pnpm test:integration
```

### Challenges Faced & Solved
- **Jest Config Path Collisions**: When Jest was run with default settings, the unit test runner attempted to execute both `*.test.ts` and `*.int.test.ts`, causing integration tests to crash due to missing container URLs. Separating configurations into `jest.config.js` (with `testPathIgnorePatterns: ['__integration__']`) and `jest.integration.config.js` completely isolated the test pipelines.
- **Coverage Gate Discrepancies**: Unit tests were initially failing the 100% coverage threshold because successful database writes were only triggered in integration tests. Adding explicit unit test coverage with mocked Prisma clients satisfied the coverage thresholds while preserving the integration suite for dialect testing.

### Next Steps
- Package APIs into production Docker containers with multi-stage builds, non-root users, and Caddy reverse proxies in Day 46.

---

**Status: ✅ Day 45 Successfully Completed**  
**Progress: 45/100 Days**  
**Milestone: Production integration testing pipeline built with Testcontainers, real PostgreSQL migrations, and isolated database lifecycles.**
