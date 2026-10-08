#!/usr/bin/env bash
# Smoke test Phase 3 (Days 44–50): Test doubles, Relationships, Environment Configs, Transactions
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "========================================================"
echo " Running Smoke Test — Phase 3: Advanced (Days 44–50)"
echo "========================================================"

ensure_built day_44_test_doubles_coverage day_48_relationships_prisma \
  day_49_environment_configs day_50_database_transactions

start_infrastructure
create_databases day48 day50

# ---- Day 44 (no database) ----------------------------------------------------
echo "== Day 44 (checkout with fakes)"
start day_44_test_doubles_coverage 4044
check "checkout → 201" 201 "$(req POST localhost:4044/api/checkout '{"email":"a@b.co","items":[{"sku":"MUG-API","quantity":1}],"cardToken":"tok_ok"}')"
check "declined card → 402" 402 "$(req POST localhost:4044/api/checkout '{"email":"a@b.co","items":[{"sku":"MUG-API","quantity":1}],"cardToken":"tok_declined"}')"
stop

# ---- Day 48 ----------------------------------------------------------------
echo "== Day 48 (relationships + N+1)"
export DATABASE_URL="$PG/day48"
migrate day_48_relationships_prisma
start day_48_relationships_prisma 4048; B=localhost:4048/api
for n in 1 2 3; do req POST $B/courses "{\"title\":\"Course $n\",\"lessons\":[{\"title\":\"Intro\",\"durationMinutes\":10},{\"title\":\"Deep dive\",\"durationMinutes\":30}],\"tags\":[\"api\",\"rest\"]}" >/dev/null; done
COURSE=$(field data.id)
check "nested write created lessons in order" 2 "$(field data.lessons.1.position)"
req GET $B/courses >/dev/null; check "proper list: 1 operation" 1 "$(header x-prisma-operations)"
req GET $B/courses/naive >/dev/null; check "naive list: 1 + 3N operations (N=3)" 10 "$(header x-prisma-operations)"
req POST $B/students '{"name":"Ada","email":"ada@example.com"}' >/dev/null; STUDENT=$(field data.id)
check "enroll → 201" 201 "$(req POST "$B/courses/$COURSE/enrollments" "{\"studentId\":\"$STUDENT\"}")"
check "enroll twice → 409" 409 "$(req POST "$B/courses/$COURSE/enrollments" "{\"studentId\":\"$STUDENT\"}")"
check "unknown student → 422 (foreign key)" 422 "$(req POST "$B/courses/$COURSE/enrollments" '{"studentId":"clx0000000000000000000999"}')"
check "deleting the course cascades to enrollments" 0 "$(req DELETE "$B/courses/$COURSE" >/dev/null; req GET "$B/students/$STUDENT/courses" >/dev/null; node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).data.length)' "$TMP/body")"
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

# ---- Day 50 ----------------------------------------------------------------
echo "== Day 50 (transactions)"
export DATABASE_URL="$PG/day50"
migrate day_50_database_transactions
start day_50_database_transactions 4050; B=localhost:4050/api
req POST $B/accounts '{"owner":"A","initialBalanceCents":10000}' >/dev/null; ACC_A=$(field data.id)
req POST $B/accounts '{"owner":"B"}' >/dev/null; ACC_B=$(field data.id)
for i in $(seq 1 20); do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST $B/transfers -H 'Content-Type: application/json' \
    -d "{\"fromId\":\"$ACC_A\",\"toId\":\"$ACC_B\",\"amountCents\":1000}" >>"$TMP/transfer-codes" &
done
wait_for_transfers() { for _ in $(seq 1 100); do [ "$(wc -l <"$TMP/transfer-codes")" -ge 20 ] && return; sleep 0.1; done; }
wait_for_transfers
check "20 concurrent transfers: exactly 10 succeed" 10 "$(grep -c '^201$' "$TMP/transfer-codes")"
check "…and 10 are refused for insufficient funds" 10 "$(grep -c '^409$' "$TMP/transfer-codes")"
check "A is exactly empty (never negative)" 0 "$(req GET "$B/accounts/$ACC_A" >/dev/null; field data.balanceCents)"
check "no money created or lost" 10000 "$(docker exec "$PG_CONTAINER" psql -U postgres -d day50 -tAc 'SELECT sum("balanceCents") FROM accounts')"
check "idempotent transfer → 201" 201 "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/transfers -H 'Content-Type: application/json' -H 'Idempotency-Key: smoke-transfer-0001' -d "{\"fromId\":\"$ACC_B\",\"toId\":\"$ACC_A\",\"amountCents\":500}")"
check "same key again → 200 replay" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/transfers -H 'Content-Type: application/json' -H 'Idempotency-Key: smoke-transfer-0001' -d "{\"fromId\":\"$ACC_B\",\"toId\":\"$ACC_A\",\"amountCents\":500}")"
check "…money moved once" 500 "$(req GET "$B/accounts/$ACC_A" >/dev/null; field data.balanceCents)"
ETAG=$(header etag)
check "PATCH without If-Match → 428" 428 "$(req PATCH "$B/accounts/$ACC_A" '{"owner":"Ada"}')"
check "PATCH with current ETag → 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$B/accounts/$ACC_A" -H 'Content-Type: application/json' -H "If-Match: $ETAG" -d '{"owner":"Ada"}')"
check "PATCH with the same (now stale) ETag → 412" 412 "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$B/accounts/$ACC_A" -H 'Content-Type: application/json' -H "If-Match: $ETAG" -d '{"owner":"Eve"}')"
stop

echo "== Startup without JWT_SECRET (Day 28)"
OUT=$(cd "$DEMOS/day_28_jwt_authentication" && JWT_SECRET='' node -e "require('./dist/config')" 2>&1)
case "$OUT" in *"Invalid environment configuration"*"JWT_SECRET"*) echo "  PASS refuses to start";; *) echo "  FAIL started without secret"; FAIL=1;; esac

echo
[ "$FAIL" = 0 ] && echo "PHASE 3 SMOKE CHECKS PASSED" || echo "PHASE 3 SMOKE CHECKS FAILED"
exit "$FAIL"
