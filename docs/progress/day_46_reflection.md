# Day 46 - Production Docker Containerization & Reverse Proxy Integration

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Package the Node.js API into an optimized, **hardened, non-root multi-stage Docker image**, orchestrate a multi-service production stack with Docker Compose (PostgreSQL, automatic migration runner, and API service), and integrate a **Caddy reverse proxy** terminating TLS with Express `trust proxy` support for accurate client IP and protocol detection.

## Key Learnings
- **Multi-Stage Build Pipeline**:
  - **Build Stage**: Installs complete dependencies (including devDependencies), generates Prisma clients, and compiles TypeScript into `dist/`.
  - **Production Stage**: Uses `pnpm deploy --prod` to generate an isolated, lean production directory containing only runtime dependencies.
- **Rootless Security Hardening**: The final container image switches to an unprivileged system user (`USER node`), protecting the host system from potential container breakout vulnerabilities.
- **BuildKit Layer Caching**: Copying `pnpm-lock.yaml` and running `pnpm fetch` before copying source code caches expensive dependency installation layers across incremental code edits.
- **Ordered Compose Lifecycle with Health Checks**: The API container depends on PostgreSQL being healthy (`pg_isready`) and the one-off `migrate` service completing with exit code 0 (`condition: service_completed_successfully`). Running `docker compose up --wait` guarantees the stack is fully operational before receiving traffic.
- **Graceful Shutdown under PID 1**: By trapping SIGTERM and SIGINT through `@restful/shared`'s `startServer`, the Node process closes database pools, finishes in-flight requests, and exits cleanly with code 0 upon receiving `docker stop`.
- **TLS Termination & Reverse Proxy Integration**: Running the stack behind a Caddy reverse proxy terminates external HTTPS traffic and forwards headers (`X-Forwarded-For`, `X-Forwarded-Proto`). Configuring Express with `app.set('trust proxy', 1)` enables `req.ip`, `req.protocol`, and `req.secure` to reflect real client states, which is vital for rate limiters and secure cookies.

## Tech Stack Used
- **Docker** (Multi-stage, BuildKit cache mounts) + **Docker Compose**
- **Caddy Server** (Reverse proxy & TLS termination)
- **Node.js 22** (`bookworm-slim`) + **pnpm**
- **Prisma** + **PostgreSQL 16**
- **Jest** + **Supertest**

## Project Structure (Day 46)
```bash
day_46_docker_containerization/
├── docker/
│   └── demo.Dockerfile       # Multi-stage production container blueprint
├── Caddyfile                  # Caddy reverse proxy routing and TLS termination
├── docker-compose.yml         # postgres -> migrate -> api -> caddy orchestration
├── src/
│   ├── config/index.ts        # Validated config with TRUST_PROXY setting
│   ├── controllers/item.controller.ts
│   ├── routes/item.routes.ts
│   ├── app.ts                 # Express app configured with trust proxy and /api/proxy-info
│   └── index.ts
├── .dockerignore
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/health` | Liveness probe (used by Docker container HEALTHCHECK) | 200 |
| GET | `/ready` | Readiness probe (verifies database connection for Compose) | 200 / 503 |
| GET | `/api/proxy-info`| Inspects forwarded client IP, protocol, and secure flags | 200 |
| GET | `/api/items` | Retrieve items catalog | 200 |
| POST | `/api/items` | Create new item | 201 |

## Reverse Proxy & Compose Orchestration

```yaml
# docker-compose.yml snippet
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    depends_on:
      api:
        condition: service_healthy

  api:
    image: restful-api-day46:latest
    environment:
      - TRUST_PROXY=1
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/day46_db
    depends_on:
      migrate:
        condition: service_completed_successfully
```

## How to Run & Verify

```bash
cd demos/intermediate/day_46_docker_containerization
cp .env.example .env

# Build and start complete stack including Caddy, API, and Postgres
pnpm docker:up

# Check proxy inspection endpoint
curl -H "X-Forwarded-For: 203.0.113.195" -H "X-Forwarded-Proto: https" http://localhost:3046/api/proxy-info

# Graceful teardown
pnpm docker:down
```

### Challenges Faced & Solved
- **Missing Build Artifacts in `pnpm deploy`**: Because `dist/` and `generated/prisma` are ignored in `.gitignore`, `pnpm deploy --prod` initially excluded them. Adding them explicitly to the package's `"files"` array in `package.json` ensured the deploy bundle includes compiled JavaScript and Prisma engines.
- **OpenSSL Library Requirements**: Alpine Node images require OpenSSL for Prisma's query engine. Using Debian `bookworm-slim` and installing `libssl3` in both the build and runtime stages ensured consistent database client initialization.
- **Trust Proxy Security**: Indiscriminately enabling `trust proxy: true` allows arbitrary clients to spoof `X-Forwarded-For` IPs. Setting `TRUST_PROXY=1` restricts trust to one upstream reverse proxy hop (Caddy), preventing IP spoofing attacks.

### Next Steps
- Harden GitHub Actions CI workflows with parallelization, coverage reporting, and container publishing in Day 47.

---

**Status: ✅ Day 46 Successfully Completed**  
**Progress: 46/100 Days**  
**Milestone: Production Docker containerization accomplished with multi-stage non-root images, Caddy reverse proxy, and health-checked compose stacks.**
