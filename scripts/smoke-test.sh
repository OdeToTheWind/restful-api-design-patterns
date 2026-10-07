#!/usr/bin/env bash
# Real-database smoke test for the intermediate demos (Days 26–49).
#
# Starts throwaway PostgreSQL, MongoDB and Redis containers (no volumes, removed on exit),
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
REDIS_CONTAINER="restful-smoke-redis-$SUFFIX"
REDIS_PORT="${SMOKE_REDIS_PORT:-56379}"
PG="postgresql://postgres:smoke@127.0.0.1:$PG_PORT"
TMP="$(mktemp -d)"
SERVER_PID=""
FAIL=0

export JWT_SECRET="smoke-test-secret-$(date +%s)-0123456789abcdef"
export NODE_ENV=development AUTH_RATE_LIMIT=1000 LOGIN_ACCOUNT_LIMIT=1000 LOG_LEVEL=error

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  docker rm -f "$PG_CONTAINER" "$MONGO_CONTAINER" "$REDIS_CONTAINER" >/dev/null 2>&1
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

# ---- databases -------------------------------------------------------------
ALL_DEMOS=$(cd "$DEMOS" && ls -d day_2[6-9]_* day_3[0-9]_* day_4[0-9]_* 2>/dev/null)
for d in $ALL_DEMOS; do
  [ -f "$DEMOS/$d/package.json" ] || continue
  [ -f "$DEMOS/$d/dist/index.js" ] || { echo "Missing $d/dist — run 'pnpm build' first."; exit 1; }
done

echo "Starting throwaway databases…"
docker run -d --rm --name "$PG_CONTAINER" -e POSTGRES_PASSWORD=smoke -p "127.0.0.1:$PG_PORT:5432" postgres:16 >/dev/null || exit 1
docker run -d --rm --name "$MONGO_CONTAINER" -p "127.0.0.1:$MONGO_PORT:27017" mongo:7 >/dev/null || exit 1
docker run -d --rm --name "$REDIS_CONTAINER" -p "127.0.0.1:$REDIS_PORT:6379" redis:7-alpine >/dev/null || exit 1
timeout 120 sh -c "until docker exec $PG_CONTAINER pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1; do sleep 1; done" || { echo "Postgres did not start"; exit 1; }
timeout 120 sh -c "until docker exec $MONGO_CONTAINER mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 1; done" || { echo "MongoDB did not start"; exit 1; }
for db in day27 day28 day29 day31 day32 day33 day35 day37 day38 day43; do docker exec "$PG_CONTAINER" createdb -U postgres "$db"; done

# ---- Day 26 ----------------------------------------------------------------
echo "== Day 26 (MongoDB + Mongoose)"
export MONGO_URI="mongodb://127.0.0.1:$MONGO_PORT/smoke26"
start day_26_mongodb_mongoose_todos 4026; B=localhost:4026/api/todos
check "create todo → 201" 201 "$(req POST $B '{"title":"Smoke test","owner":"x"}')"
ID=$(field data._id)
check "unknown field dropped" undefined "$(field data.owner)"
probes 4026
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
check "update missing → 404 (P2025)" 404 "$(req PUT $B/clx0000000000000000000999 '{"age":1}')"
check "malformed id → 400" 400 "$(req PUT $B/nope '{"age":1}')"
probes 4027
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
  probes "40$DAY"
  check "helmet header" nosniff "$(curl -s -D - -o /dev/null "localhost:40$DAY/" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-content-type-options"{print $2}')"
  if [ "$DAY" = 28 ]; then
    # Restart with a low per-account limit to see the lock against the real app
    stop
    LOGIN_ACCOUNT_LIMIT=2 start "$DIR" "40$DAY"
    req POST $B/login '{"email":"ada@example.com","password":"wrong-1"}' >/dev/null
    req POST $B/login '{"email":"ada@example.com","password":"wrong-2"}' >/dev/null
    check "3rd failed login for one account → 429" 429 "$(req POST $B/login '{"email":"ada@example.com","password":"wrong-3"}')"
    check "other accounts unaffected → 401" 401 "$(req POST $B/login '{"email":"x@example.com","password":"wrong-pass"}')"
  fi
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
probes 4030
check "AppError → 400" 400 "$(req GET $B/bad-request)"
check "crash → generic 500" "Internal Server Error" "$(req GET $B/server-error >/dev/null; field message)"
check "unknown route → JSON 404" false "$(req GET localhost:4030/api/nope >/dev/null; field success)"
stop

# ---- Day 31 ----------------------------------------------------------------
echo "== Day 31 (spec-first OpenAPI)"
export DATABASE_URL="$PG/day31"
migrate day_31_swagger_openapi_docs
start day_31_swagger_openapi_docs 4031; B=localhost:4031/api/books
probes 4031
check "create book (hyphenated ISBN) → 201" 201 "$(req POST $B '{"title":"Refactoring","author":"Martin Fowler","isbn":"978-0-13-475759-9"}')"
check "ISBN normalised" 9780134757599 "$(field data.isbn)"
BOOK=$(field data.id)
check "duplicate ISBN → 409" 409 "$(req POST $B '{"title":"Copy","author":"X","isbn":"9780134757599"}')"
check "patch → 200" 200 "$(req PATCH "$B/$BOOK" '{"publishedYear":2018}')"
check "get → 200" 200 "$(req GET "$B/$BOOK")"
check "served spec is OpenAPI 3.1" 3.1.0 "$(req GET localhost:4031/api/docs/openapi.json >/dev/null; field openapi)"
stop

# ---- Day 32 ----------------------------------------------------------------
echo "== Day 32 (pagination, filtering, sorting)"
export DATABASE_URL="$PG/day32"
migrate day_32_advanced_pagination_filter_sort
start day_32_advanced_pagination_filter_sort 4032; B=localhost:4032/api/products
for p in "Clean Code:books:3999" "Refactoring:books:4599" "SICP:books:5099" "Chess:games:1999" "Go:games:2999"; do
  IFS=: read -r name category price <<<"$p"
  req POST $B "{\"name\":\"$name\",\"category\":\"$category\",\"priceCents\":$price}" >/dev/null
done
check "filter + sort + page → 200" 200 "$(req GET "$B?category=books&sort=-price&pageSize=2")"
check "total books" 3 "$(field data.meta.totalItems)"
check "most expensive first" SICP "$(field data.items.0.name)"
check "2 pages" 2 "$(field data.meta.totalPages)"
check "price range filter" 2 "$(req GET "$B?minPrice=2000&maxPrice=4000" >/dev/null; field data.meta.totalItems)"
req GET "$B/feed?limit=3" >/dev/null; CURSOR=$(field data.meta.nextCursor)
check "feed page 1 has a cursor" true "$([ "$CURSOR" != null ] && echo true || echo false)"
check "feed page 2 continues after it" 2 "$(req GET "$B/feed?limit=3&cursor=$CURSOR" >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.items.length)' "$TMP/body")"
check "unknown sort → 400" 400 "$(req GET "$B?sort=password")"
stop

# ---- Day 33 ----------------------------------------------------------------
echo "== Day 33 (Redis caching)"
export DATABASE_URL="$PG/day33" REDIS_URL="redis://127.0.0.1:$REDIS_PORT"
migrate day_33_caching_redis_intro
start day_33_caching_redis_intro 4033; B=localhost:4033/api/products
req POST $B '{"name":"Keyboard","priceCents":4999}' >/dev/null; PRODUCT=$(field data.id)
req GET "$B/$PRODUCT" >/dev/null; check "first read → MISS" MISS "$(header x-cache)"
req GET "$B/$PRODUCT" >/dev/null; check "second read → HIT" HIT "$(header x-cache)"
req PATCH "$B/$PRODUCT" '{"priceCents":3999}' >/dev/null
req GET "$B/$PRODUCT" >/dev/null; check "after update → MISS" MISS "$(header x-cache)"
check "fresh value after update" 3999 "$(field data.priceCents)"
req GET $B >/dev/null; req GET $B >/dev/null; check "list cached → HIT" HIT "$(header x-cache)"
docker stop "$REDIS_CONTAINER" >/dev/null
check "Redis down: still 200" 200 "$(req GET "$B/$PRODUCT")"
check "Redis down: X-Cache BYPASS" BYPASS "$(header x-cache)"
stop

# ---- Day 35 ----------------------------------------------------------------
echo "== Day 35 (seeding)"
export DATABASE_URL="$PG/day35"
migrate day_35_seeding_migrations
seed35() { (cd "$DEMOS/day_35_seeding_migrations" && SEED_PROFILE=demo npx prisma db seed >"$TMP/seed.log" 2>&1) || { echo "  FAIL seed:"; cat "$TMP/seed.log"; FAIL=1; }; }
seed35
start day_35_seeding_migrations 4035; B=localhost:4035/api
check "published posts after seeding" 12 "$(req GET $B/posts >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.length)' "$TMP/body")"
seed35
check "seeding twice changes nothing (idempotent)" 12 "$(req GET $B/posts >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.length)' "$TMP/body")"
check "authors" 3 "$(req GET $B/authors >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.length)' "$TMP/body")"
check "drafts are not served → 404" 404 "$(req GET $B/posts/caching-headers-1)"
stop

# ---- Day 37 ----------------------------------------------------------------
echo "== Day 37 (repository + service layer)"
export DATABASE_URL="$PG/day37"
migrate day_37_repository_service_layer
start day_37_repository_service_layer 4037; B=localhost:4037/api/tasks
probes 4037
req POST $B '{"title":"Ship it","dueDate":"2099-01-01"}' >/dev/null; TASK=$(field data.id)
check "TODO → DONE is refused → 409" 409 "$(req PUT "$B/$TASK/status" '{"status":"DONE"}')"
check "TODO → IN_PROGRESS → 200" 200 "$(req PUT "$B/$TASK/status" '{"status":"IN_PROGRESS"}')"
check "IN_PROGRESS → DONE → 200" 200 "$(req PUT "$B/$TASK/status" '{"status":"DONE"}')"
check "completedAt recorded" true "$([ "$(field data.completedAt)" != null ] && echo true || echo false)"
check "done tasks can't be deleted → 409" 409 "$(req DELETE "$B/$TASK")"
stop

# ---- Day 38 ----------------------------------------------------------------
echo "== Day 38 (DTOs + mappers)"
export DATABASE_URL="$PG/day38"
migrate day_38_dtos_mappers
start day_38_dtos_mappers 4038; B=localhost:4038/api
check "register (role in body) → 201" 201 "$(req POST $B/auth/register '{"email":"ada@example.com","password":"correct-horse","displayName":"Ada","role":"ADMIN"}')"
USER38=$(field data.id)
check "registered as USER" USER "$(field data.role)"
req POST $B/auth/login '{"email":"ada@example.com","password":"correct-horse"}' >/dev/null; T38=$(field data.token)
check "public view has no email" undefined "$(req GET "$B/users/$USER38" >/dev/null; field data.email)"
check "private view has email" ada@example.com "$(req GET $B/me '' "$T38" >/dev/null; field data.email)"
check "USER → admin list 403" 403 "$(req GET $B/admin/users '' "$T38")"
docker exec "$PG_CONTAINER" psql -U postgres -d day38 -qc "UPDATE users SET role='ADMIN', \"internalNotes\"='vip' WHERE email='ada@example.com'" >/dev/null
req POST $B/auth/login '{"email":"ada@example.com","password":"correct-horse"}' >/dev/null; T38=$(field data.token)
check "admin view includes notes" vip "$(req GET $B/admin/users '' "$T38" >/dev/null; field data.0.internalNotes)"
check "no password hash in any view" 0 "$(grep -c 'passwordHash\|\$2a\$' "$TMP/body" || true)"
stop

# ---- Day 43 ----------------------------------------------------------------
echo "== Day 43 (cookie sessions)"
export DATABASE_URL="$PG/day43"
migrate day_43_auth_sessions_cookies
start day_43_auth_sessions_cookies 4043; B=localhost:4043/api/auth
JAR="$TMP/cookies"
req POST $B/register '{"name":"Ada","email":"ada@example.com","password":"correct-horse"}' >/dev/null
check "login → 200" 200 "$(curl -s -o "$TMP/body" -w '%{http_code}' -c "$JAR" -X POST $B/login -H 'Content-Type: application/json' -d '{"email":"ada@example.com","password":"correct-horse"}')"
T43=$(field data.token)
check "refresh token not in body" 0 "$(grep -ci refresh "$TMP/body" || true)"
check "refresh cookie is HttpOnly" 1 "$(grep -c '^#HttpOnly_localhost.*refresh_token' "$JAR" || true)"
CSRF=$(awk '$6=="csrf_token"{print $7}' "$JAR")
check "refresh without CSRF header → 403" 403 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -X POST $B/refresh)"
check "refresh with CSRF header → 200" 200 "$(curl -s -o "$TMP/body" -w '%{http_code}' -b "$JAR" -c "$JAR" -X POST $B/refresh -H "X-CSRF-Token: $CSRF")"
check "one active session, marked current" true "$(req GET $B/sessions '' "$(field data.token)" >/dev/null; field data.0.current)"
CSRF=$(awk '$6=="csrf_token"{print $7}' "$JAR")
check "logout → 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -c "$JAR" -X POST $B/logout -H "X-CSRF-Token: $CSRF")"
check "no sessions left" 0 "$(req GET $B/sessions '' "$T43" >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.length)' "$TMP/body")"
stop

# ---- Day 49 ----------------------------------------------------------------
echo "== Day 49 (environment configs)"
OUT=$(cd "$DEMOS/day_49_environment_configs" && NODE_ENV=production ADMIN_API_KEY= timeout 10 node dist/index.js 2>&1)
case "$OUT" in *"ADMIN_API_KEY: is required in production"*) echo "  PASS production refuses to start without ADMIN_API_KEY";; *) echo "  FAIL production started without ADMIN_API_KEY"; FAIL=1;; esac
KEY49=$(node -e "console.log('k'.repeat(32))")
NODE_ENV=production ADMIN_API_KEY="$KEY49" LOG_LEVEL=error start day_49_environment_configs 4049
check "environment from NODE_ENV" production "$(req GET localhost:4049/api/info >/dev/null; field data.environment)"
check ".env.production defaults applied (flag off)" false "$(field data.features.newGreeting)"
check "admin config → 200 with key" 200 "$(curl -s -o "$TMP/body" -w '%{http_code}' -H "X-Admin-Key: $KEY49" localhost:4049/api/admin/config)"
check "secret redacted" "[set]" "$(field data.adminApiKey)"
stop

echo "== Startup without JWT_SECRET (Day 28)"
OUT=$(cd "$DEMOS/day_28_jwt_authentication" && JWT_SECRET='' node -e "require('./dist/config')" 2>&1)
case "$OUT" in *"Invalid environment configuration"*"JWT_SECRET"*) echo "  PASS refuses to start";; *) echo "  FAIL started without secret"; FAIL=1;; esac

echo
[ "$FAIL" = 0 ] && echo "ALL SMOKE CHECKS PASSED" || echo "SOME SMOKE CHECKS FAILED"
exit "$FAIL"
