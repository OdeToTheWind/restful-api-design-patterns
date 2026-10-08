#!/usr/bin/env bash
# Smoke test Phase 1 (Days 26–33): Core DB, Auth, Errors, OpenAPI, Pagination, Caching
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "========================================================"
echo " Running Smoke Test — Phase 1: Core (Days 26–33)"
echo "========================================================"

ensure_built day_26_mongodb_mongoose_todos day_27_postgres_prisma_users day_28_jwt_authentication \
  day_29_rbac_roles_permissions day_30_global_error_middleware day_31_swagger_openapi_docs \
  day_32_advanced_pagination_filter_sort day_33_caching_redis_intro

start_infrastructure
create_databases day27 day28 day29 day31 day32 day33

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

echo
[ "$FAIL" = 0 ] && echo "PHASE 1 SMOKE CHECKS PASSED" || echo "PHASE 1 SMOKE CHECKS FAILED"
exit "$FAIL"
