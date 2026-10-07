# syntax=docker/dockerfile:1.7
#
# Builds any workspace demo into a small production image. Build from the repo root:
#   docker build -f docker/demo.Dockerfile --build-arg PACKAGE=day_46_docker_containerization -t day46 .
#
# Stages: base (Node + pnpm) → build (install, compile, prune to prod deps) → runtime (only the output)

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
# Prisma's query engine needs OpenSSL; ca-certificates for outbound TLS
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG PACKAGE
# Lockfile first: dependency downloads stay cached until the lockfile changes
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
# Only the target demo and what it depends on (@restful/shared); runs prisma generate (postinstall)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile --filter "${PACKAGE}..."
RUN pnpm --filter "${PACKAGE}..." run build
# Self-contained folder: the package's "files" + production node_modules only
RUN pnpm --filter "${PACKAGE}" deploy --prod /out

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# Never run as root inside the container
USER node
# Liveness probe; readiness (/ready) is checked by the orchestrator, e.g. docker-compose.yml
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# Node is PID 1 and handles SIGTERM itself (startServer), so `docker stop` shuts down gracefully
CMD ["node", "dist/index.js"]
