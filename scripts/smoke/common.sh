#!/usr/bin/env bash
# Common infrastructure and assertion helpers for smoke testing.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEMOS="$ROOT/demos/intermediate"
PG_PORT="${SMOKE_PG_PORT:-55432}"
MONGO_PORT="${SMOKE_MONGO_PORT:-57017}"
SUFFIX="$$"
PG_CONTAINER="restful-smoke-pg-$SUFFIX"
MONGO_CONTAINER="restful-smoke-mongo-$SUFFIX"
REDIS_CONTAINER="restful-smoke-redis-$SUFFIX"
REDIS_PORT="${SMOKE_REDIS_PORT:-56379}"
QUEUE_REDIS_CONTAINER="restful-smoke-queue-redis-$SUFFIX"
QUEUE_REDIS_PORT="${SMOKE_QUEUE_REDIS_PORT:-56380}"
S3_CONTAINER="restful-smoke-s3-$SUFFIX"
S3_PORT="${SMOKE_S3_PORT:-58333}"
MAILPIT_CONTAINER="restful-smoke-mailpit-$SUFFIX"
MAILPIT_SMTP_PORT="${SMOKE_MAILPIT_SMTP_PORT:-51025}"
MAILPIT_HTTP_PORT="${SMOKE_MAILPIT_HTTP_PORT:-58025}"
WORKER_PID=""
PG="postgresql://postgres:smoke@127.0.0.1:$PG_PORT"
TMP="$(mktemp -d)"
SERVER_PID=""
FAIL=0

export JWT_SECRET="smoke-test-secret-$(date +%s)-0123456789abcdef"
export NODE_ENV=development AUTH_RATE_LIMIT=1000 LOGIN_ACCOUNT_LIMIT=1000 LOG_LEVEL=error

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  [ -n "$WORKER_PID" ] && kill "$WORKER_PID" 2>/dev/null
  docker rm -f "$PG_CONTAINER" "$MONGO_CONTAINER" "$REDIS_CONTAINER" "$QUEUE_REDIS_CONTAINER" "$S3_CONTAINER" "$MAILPIT_CONTAINER" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap cleanup EXIT

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "  PASS $1"; else echo "  FAIL $1 — expected '$2', got '$3'"; FAIL=1; fi
}

req() { # method url [json] [bearer] -> prints status; body saved to $TMP/body, headers to $TMP/headers
  local args=(-s -o "$TMP/body" -D "$TMP/headers" -w '%{http_code}' -X "$1" "$2" -H 'Content-Type: application/json')
  [ -n "${3:-}" ] && args+=(-d "$3")
  [ -n "${4:-}" ] && args+=(-H "Authorization: Bearer $4")
  curl "${args[@]}"
}

field() { # dotted path into the last JSON body, e.g. data.user.role
  node -e '
    const v = process.argv[1].split(".").reduce((o, k) => (o == null ? o : o[k]), JSON.parse(require("fs").readFileSync(process.argv[2], "utf8")));
    console.log(v === undefined ? "undefined" : typeof v === "object" ? JSON.stringify(v) : v);
  ' "$1" "$TMP/body"
}

header() { tr -d '\r' < "$TMP/headers" | awk -F': ' -v h="$1" 'tolower($1)==h {print $2}'; }

start() { # dir port
  (cd "$DEMOS/$1" && PORT="$2" exec node dist/index.js >"$TMP/$1.log" 2>&1) &
  SERVER_PID=$!
  for _ in $(seq 1 75); do curl -s "localhost:$2/" >/dev/null && return 0; sleep 0.2; done
  echo "  FAIL $1 did not start:"; cat "$TMP/$1.log"; FAIL=1
}

stop() { # SIGTERM → the server must drain, close its DB connection and exit 0
  kill -TERM "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; local code=$?
  SERVER_PID=""
  check "graceful shutdown on SIGTERM (exit 0)" 0 "$code"
}

probes() { # port — liveness and readiness against the real database
  check "/health → 200" 200 "$(req GET "localhost:$1/health")"
  check "/ready → 200 (database up)" 200 "$(req GET "localhost:$1/ready")"
}

migrate() { (cd "$DEMOS/$1" && npx prisma migrate deploy >"$TMP/$1.migrate.log" 2>&1) || { echo "  FAIL migrations for $1:"; cat "$TMP/$1.migrate.log"; FAIL=1; }; }

ensure_built() {
  local demos=("$@")
  for d in "${demos[@]}"; do
    [ -f "$DEMOS/$d/package.json" ] || continue
    [ -f "$DEMOS/$d/dist/index.js" ] || { echo "Missing $d/dist — run 'pnpm build' first."; exit 1; }
  done
}

start_infrastructure() {
  echo "Starting throwaway containers for smoke test…"
  docker run -d --rm --name "$PG_CONTAINER" -e POSTGRES_PASSWORD=smoke -p "127.0.0.1:$PG_PORT:5432" postgres:16 >/dev/null || exit 1
  docker run -d --rm --name "$MONGO_CONTAINER" -p "127.0.0.1:$MONGO_PORT:27017" mongo:7 >/dev/null || exit 1
  docker run -d --rm --name "$REDIS_CONTAINER" -p "127.0.0.1:$REDIS_PORT:6379" redis:7-alpine >/dev/null || exit 1
  docker run -d --rm --name "$QUEUE_REDIS_CONTAINER" -p "127.0.0.1:$QUEUE_REDIS_PORT:6379" redis:7-alpine >/dev/null || exit 1

  printf '{"identities":[{"name":"smoke","credentials":[{"accessKey":"smoke-key","secretKey":"smoke-secret-123"}],"actions":["Admin","Read","Write","List","Tagging"]}]}' >"$TMP/s3.json"
  chmod 644 "$TMP/s3.json"
  docker run -d --rm --name "$S3_CONTAINER" -v "$TMP/s3.json:/etc/seaweedfs/s3.json:ro" -p "127.0.0.1:$S3_PORT:8333" \
    chrislusf/seaweedfs server -s3 -s3.config=/etc/seaweedfs/s3.json >/dev/null || exit 1
  docker run -d --rm --name "$MAILPIT_CONTAINER" -p "127.0.0.1:$MAILPIT_SMTP_PORT:1025" -p "127.0.0.1:$MAILPIT_HTTP_PORT:8025" axllent/mailpit >/dev/null || exit 1

  timeout 120 sh -c "until docker exec $PG_CONTAINER pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1; do sleep 1; done" || { echo "Postgres did not start"; exit 1; }
  timeout 120 sh -c "until docker exec $MONGO_CONTAINER mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 1; done" || { echo "MongoDB did not start"; exit 1; }
  timeout 120 sh -c "until [ \"\$(curl -s -o /dev/null -w %{http_code} localhost:$S3_PORT)\" != 000 ]; do sleep 1; done" || { echo "S3 storage did not start"; exit 1; }
  timeout 60 sh -c "until curl -sf localhost:$MAILPIT_HTTP_PORT/api/v1/messages >/dev/null; do sleep 1; done" || { echo "Mailpit did not start"; exit 1; }
}

create_databases() {
  local dbs=("$@")
  for db in "${dbs[@]}"; do
    docker exec "$PG_CONTAINER" createdb -U postgres "$db" 2>/dev/null || true
  done
}
