# Day 46 - Docker Containerization

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Package a demo as a **small, non-root production image** and run the whole stack — database, migrations, API — with Docker Compose and health checks.

## Key Learnings
- Multi-stage build: dependencies and compilation in `build`, only the output in `runtime`
- `pnpm deploy --prod` produces a self-contained folder with production dependencies only (no TypeScript, no Jest)
- Copy the lockfile first and `pnpm fetch` so dependency layers stay cached until the lockfile changes
- Migrations run as a one-off `migrate` service; the API starts only after it completes successfully
- Health checks: `pg_isready` for Postgres, `/ready` for the API — `docker compose up --wait` waits for all of them
- Node runs as PID 1 and handles SIGTERM itself (`startServer`), so `docker stop` shuts down gracefully with exit code 0

## Tech Stack Used
- **Docker** (multi-stage, BuildKit cache mounts), **Docker Compose**
- **Node.js 22** (bookworm-slim), **pnpm deploy**
- **Prisma** + **PostgreSQL**

## Project Structure (Day 46)
```
docker/demo.Dockerfile        ← reusable for any demo: --build-arg PACKAGE=<name>
.dockerignore                 ← no node_modules, build output or .env files in the context
demos/intermediate/day_46_docker_containerization/
└── docker-compose.yml        ← postgres → migrate → api
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness (also the image HEALTHCHECK) |
| GET | `/ready` | Readiness (database) — compose health check |
| * | `/api/items` | Items CRUD from the template |

## How to Run
```bash
cd demos/intermediate/day_46_docker_containerization
cp .env.example .env
pnpm docker:up       # docker compose up --build --wait
curl localhost:3046/ready
pnpm docker:down
```

### Challenges Faced & Solved
- `generated/` and `dist/` are git-ignored, so the package lists them in `"files"` for `pnpm deploy` to include them
- The Prisma CLI moved to `dependencies` here because the image runs `prisma migrate deploy`
- Prisma needs OpenSSL in both the build and the runtime stage

### Next Steps
- Day 47: build and test this image in CI
