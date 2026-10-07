#!/usr/bin/env bash
# Real-database smoke test for the intermediate demos (Days 26–30).
#
# Starts throwaway PostgreSQL + MongoDB containers (no volumes, removed on exit),
# applies each demo's real Prisma migrations, starts every demo from dist/ and
# checks its behaviour over HTTP. Your own containers, volumes and .env files are
# not touched: everything is passed through environment variables.
#
# Usage:  pnpm build && pnpm smoke
# Needs:  docker, curl, node
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMOS="$ROOT/demos/intermediate"
PG_PORT="${SMOKE_PG_PORT:-55432}"
MONGO_PORT="${SMOKE_MONGO_PORT:-57017}"
SUFFIX="$$"
PG_CONTAINER="restful-smoke-pg-$SUFFIX"
MONGO_CONTAINER="restful-smoke-mongo-$SUFFIX"
PG="postgresql://postgres:smoke@127.0.0.1:$PG_PORT"
TMP="$(mktemp -d)"
SERVER_PID=""
FAIL=0

export JWT_SECRET="smoke-test-secret-$(date +%s)-0123456789abcdef"
export NODE_ENV=development AUTH_RATE_LIMIT=1000 LOG_LEVEL=error

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  docker rm -f "$PG_CONTAINER" "$MONGO_CONTAINER" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap cleanup EXIT

# ---- helpers ---------------------------------------------------------------
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
stop() { kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; SERVER_PID=""; }
migrate() { (cd "$DEMOS/$1" && npx prisma migrate deploy >"$TMP/$1.migrate.log" 2>&1) || { echo "  FAIL migrations for $1:"; cat "$TMP/$1.migrate.log"; FAIL=1; }; }

# ---- databases -------------------------------------------------------------
for d in day_26_mongodb_mongoose_todos day_27_postgres_prisma_users day_28_jwt_authentication day_29_rbac_roles_permissions day_30_global_error_middleware; do
  [ -f "$DEMOS/$d/dist/index.js" ] || { echo "Missing $d/dist — run 'pnpm build' first."; exit 1; }
done

echo "Starting throwaway databases…"
docker run -d --rm --name "$PG_CONTAINER" -e POSTGRES_PASSWORD=smoke -p "127.0.0.1:$PG_PORT:5432" postgres:16 >/dev/null || exit 1
docker run -d --rm --name "$MONGO_CONTAINER" -p "127.0.0.1:$MONGO_PORT:27017" mongo:7 >/dev/null || exit 1
timeout 120 sh -c "until docker exec $PG_CONTAINER pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1; do sleep 1; done" || { echo "Postgres did not start"; exit 1; }
timeout 120 sh -c "until docker exec $MONGO_CONTAINER mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 1; done" || { echo "MongoDB did not start"; exit 1; }
for db in day27 day28 day29; do docker exec "$PG_CONTAINER" createdb -U postgres "$db"; done

# ---- Day 26 ----------------------------------------------------------------
echo "== Day 26 (MongoDB + Mongoose)"
export MONGO_URI="mongodb://127.0.0.1:$MONGO_PORT/smoke26"
start day_26_mongodb_mongoose_todos 4026; B=localhost:4026/api/todos
check "create todo → 201" 201 "$(req POST $B '{"title":"Smoke test","owner":"x"}')"
ID=$(field data._id)
check "unknown field dropped" undefined "$(field data.owner)"
check "X-Request-Id header set" true "$([ -n "$(header x-request-id)" ] && echo true || echo false)"
check "list todos → 200" 200 "$(req GET $B)"
check "update todo → 200" 200 "$(req PUT "$B/$ID" '{"completed":true}')"
check "completed persisted" true "$(field data.completed)"
check "invalid ObjectId → 400" 400 "$(req PUT $B/not-an-id '{"completed":true}')"
check "missing todo → 404" 404 "$(req DELETE $B/000000000000000000000000)"
check "delete todo → 200" 200 "$(req DELETE "$B/$ID")"
check "missing title → 400" 400 "$(req POST $B '{}')"
stop

# ---- Day 27 ----------------------------------------------------------------
echo "== Day 27 (PostgreSQL + Prisma)"
export DATABASE_URL="$PG/day27"
migrate day_27_postgres_prisma_users
start day_27_postgres_prisma_users 4027; B=localhost:4027/api/users
check "create user (role in body) → 201" 201 "$(req POST $B '{"name":"Ada","email":"ADA@example.com","role":"ADMIN"}')"
check "role stays USER in DB" USER "$(field data.role)"
check "email lowercased" ada@example.com "$(field data.email)"
UID27=$(field data.id)
check "duplicate email → 409 (P2002)" 409 "$(req POST $B '{"name":"Ada","email":"ada@example.com"}')"
req PUT "$B/$UID27" '{"role":"ADMIN","age":37}' >/dev/null
check "role ignored on update" USER "$(field data.role)"
check "update missing → 404 (P2025)" 404 "$(req PUT $B/nope '{"age":1}')"
check "list users → 200" 200 "$(req GET $B)"
check "delete user → 200" 200 "$(req DELETE "$B/$UID27")"
check "delete again → 404" 404 "$(req DELETE "$B/$UID27")"
stop

# ---- Days 28 & 29 ----------------------------------------------------------
for DAY in 28 29; do
  DIR=$(cd "$DEMOS" && ls -d day_${DAY}_*)
  echo "== Day $DAY (JWT + refresh tokens$([ $DAY = 29 ] && echo ' + RBAC + OpenAPI'))"
  export DATABASE_URL="$PG/day$DAY"
  migrate "$DIR"
  start "$DIR" "40$DAY"; B="localhost:40$DAY/api/auth"
  check "register (role ADMIN in body) → 201" 201 "$(req POST $B/register '{"name":"Ada","email":"ada@example.com","password":"correct-horse","role":"ADMIN"}')"
  check "registered as USER" USER "$(field data.role)"
  check "no password in response" undefined "$(field data.password)"
  check "duplicate register → 409" 409 "$(req POST $B/register '{"name":"Ada","email":"ada@example.com","password":"correct-horse"}')"
  check "weak password → 400" 400 "$(req POST $B/register '{"name":"Bo","email":"bo@example.com","password":"123"}')"
  check "wrong password → 401" 401 "$(req POST $B/login '{"email":"ada@example.com","password":"wrong-pass"}')"
  check "unknown email → 401" 401 "$(req POST $B/login '{"email":"x@example.com","password":"wrong-pass"}')"
  check "login → 200" 200 "$(req POST $B/login '{"email":"ada@example.com","password":"correct-horse"}')"
  TOKEN=$(field data.token); REFRESH1=$(field data.refreshToken)
  check "access token lifetime 900s" 900 "$(field data.expiresIn)"
  check "/me with token → 200" 200 "$(req GET $B/me '' "$TOKEN")"
  check "/me without token → 401" 401 "$(req GET $B/me)"
  check "refresh → 200" 200 "$(req POST $B/refresh "{\"refreshToken\":\"$REFRESH1\"}")"
  REFRESH2=$(field data.refreshToken)
  check "refresh token rotated" true "$([ "$REFRESH1" != "$REFRESH2" ] && echo true || echo false)"
  check "reusing rotated token → 401" 401 "$(req POST $B/refresh "{\"refreshToken\":\"$REFRESH1\"}")"
  check "…which revoked the whole session family" 401 "$(req POST $B/refresh "{\"refreshToken\":\"$REFRESH2\"}")"
  req POST $B/login '{"email":"ada@example.com","password":"correct-horse"}' >/dev/null; REFRESH3=$(field data.refreshToken)
  check "logout → 200" 200 "$(req POST $B/logout "{\"refreshToken\":\"$REFRESH3\"}")"
  check "refresh after logout → 401" 401 "$(req POST $B/refresh "{\"refreshToken\":\"$REFRESH3\"}")"
  check "only hashes stored in DB" 0 "$(docker exec "$PG_CONTAINER" psql -U postgres -d "day$DAY" -tAc "SELECT count(*) FROM refresh_tokens WHERE \"tokenHash\" IN ('$REFRESH1','$REFRESH2','$REFRESH3')")"
  check "helmet header" nosniff "$(curl -s -D - -o /dev/null "localhost:40$DAY/" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-content-type-options"{print $2}')"
  if [ "$DAY" = 29 ]; then
    U=localhost:4029/api/users
    req POST $B/login '{"email":"ada@example.com","password":"correct-horse"}' >/dev/null; USER_TOKEN=$(field data.token)
    check "USER → /users 403" 403 "$(req GET $U '' "$USER_TOKEN")"
    check "USER → /users/admin 403" 403 "$(req GET $U/admin '' "$USER_TOKEN")"
    docker exec "$PG_CONTAINER" psql -U postgres -d day29 -qc "UPDATE users SET role='ADMIN' WHERE email='ada@example.com'" >/dev/null
    req POST $B/login '{"email":"ada@example.com","password":"correct-horse"}' >/dev/null; ADMIN=$(field data.token)
    check "ADMIN → /users 200" 200 "$(req GET $U '' "$ADMIN")"
    check "ADMIN → /users/admin 200" 200 "$(req GET $U/admin '' "$ADMIN")"
    check "real user count" 1 "$(field data.stats.totalUsers)"
    check "OpenAPI spec → 200" 200 "$(req GET localhost:4029/api/docs/openapi.json)"
    check "OpenAPI version" 3.1.0 "$(field openapi)"
    check "Swagger UI → 200" 200 "$(req GET localhost:4029/api/docs/)"
  fi
  stop
done

# ---- Day 30 ----------------------------------------------------------------
echo "== Day 30 (global error middleware via @restful/shared)"
start day_30_global_error_middleware 4030; B=localhost:4030/api/test
check "AppError → 400" 400 "$(req GET $B/bad-request)"
check "crash → generic 500" "Internal Server Error" "$(req GET $B/server-error >/dev/null; field message)"
check "unknown route → JSON 404" false "$(req GET localhost:4030/api/nope >/dev/null; field success)"
stop

echo "== Startup without JWT_SECRET (Day 28)"
OUT=$(cd "$DEMOS/day_28_jwt_authentication" && JWT_SECRET='' node -e "require('./dist/config')" 2>&1)
case "$OUT" in *"Missing required environment variable: JWT_SECRET"*) echo "  PASS refuses to start";; *) echo "  FAIL started without secret"; FAIL=1;; esac

echo
[ "$FAIL" = 0 ] && echo "ALL SMOKE CHECKS PASSED" || echo "SOME SMOKE CHECKS FAILED"
exit "$FAIL"
