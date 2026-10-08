#!/usr/bin/env bash
# Smoke test Phase 2 (Days 34–43): Architecture, Logging, Seeding, Soft delete, DTOs, Uploads, Queues, Webhooks, Sessions
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "========================================================"
echo " Running Smoke Test — Phase 2: Services (Days 34–43)"
echo "========================================================"

ensure_built day_34_winston_log_context day_35_seeding_migrations day_36_soft_delete_pattern \
  day_37_repository_service_layer day_38_dtos_mappers day_39_file_upload_cloud_storage \
  day_40_email_notifications_queue day_41_webhook_endpoints day_42_api_versioning_uri \
  day_43_auth_sessions_cookies

start_infrastructure
create_databases day35 day36 day37 day38 day39 day41 day43

# ---- Day 34 ----------------------------------------------------------------
echo "== Day 34 (log context + redaction)"
TOKEN34=$(cd "$DEMOS/day_34_winston_log_context" && node -e "console.log(require('jsonwebtoken').sign({id:'user-34',email:'a@b.co',role:'USER'}, process.env.JWT_SECRET))")
LOG_LEVEL=debug start day_34_winston_log_context 4034
curl -s -o "$TMP/body" -X POST localhost:4034/api/orders -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN34" -H 'X-Request-Id: smoke-req-34' \
  -d '{"items":[{"sku":"book-rest","quantity":1}],"cardToken":"tok_live_secret_9999"}' >/dev/null
req GET "localhost:4034/api/debug/logs?requestId=smoke-req-34" >/dev/null
check "service log carries the request's userId" user-34 "$(node -e 'const l=JSON.parse(require("fs").readFileSync(process.argv[1])).data.find(e=>e.message==="charging card");console.log(l&&l.userId)' "$TMP/body")"
check "card token redacted in the written log" 0 "$(grep -c tok_live_secret_9999 "$TMP/body" || true)"
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

# ---- Day 36 ----------------------------------------------------------------
echo "== Day 36 (soft delete)"
export DATABASE_URL="$PG/day36"
migrate day_36_soft_delete_pattern
start day_36_soft_delete_pattern 4036; B=localhost:4036/api/articles
req POST $B '{"slug":"rest-tips","title":"REST tips","body":"v1"}' >/dev/null; OLD=$(field data.id)
check "duplicate active slug → 409" 409 "$(req POST $B '{"slug":"rest-tips","title":"Again","body":"x"}')"
check "delete moves to trash → 200" 200 "$(req DELETE "$B/$OLD")"
check "deleted article is hidden → 404" 404 "$(req GET $B/rest-tips)"
check "row still exists (soft delete)" 1 "$(docker exec "$PG_CONTAINER" psql -U postgres -d day36 -tAc "SELECT count(*) FROM articles WHERE \"deletedAt\" IS NOT NULL")"
check "slug reusable once the old one is deleted → 201" 201 "$(req POST $B '{"slug":"rest-tips","title":"REST tips v2","body":"v2"}')"
NEW=$(field data.id)
check "restoring the old one now conflicts (partial unique index) → 409" 409 "$(req POST "$B/$OLD/restore")"
req DELETE "$B/$NEW" >/dev/null
check "restore after the slug is free → 200" 200 "$(req POST "$B/$OLD/restore")"
check "purge only from the trash → 404 for an active article" 404 "$(req DELETE "$B/$OLD/permanent")"
check "purge from the trash → 200" 200 "$(req DELETE "$B/$NEW/permanent")"
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

# ---- Day 39 ----------------------------------------------------------------
echo "== Day 39 (pre-signed uploads to S3-compatible storage)"
export DATABASE_URL="$PG/day39" S3_ENDPOINT="http://127.0.0.1:$S3_PORT" S3_ACCESS_KEY_ID=smoke-key S3_SECRET_ACCESS_KEY=smoke-secret-123 S3_CREATE_BUCKET=true S3_BUCKET=uploads
migrate day_39_file_upload_cloud_storage
start day_39_file_upload_cloud_storage 4039; B=localhost:4039/api/files
probes 4039
head -c 2048 /dev/urandom > "$TMP/upload.png"
req POST $B '{"filename":"diagram.png","contentType":"image/png","sizeBytes":2048}' >/dev/null
FILE=$(field data.file.id); URL=$(field data.upload.url)
check "PUT straight to storage with the signed URL → 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H 'Content-Type: image/png' --data-binary @"$TMP/upload.png" "$URL")"
check "complete → READY" READY "$(req POST "$B/$FILE/complete" >/dev/null; field data.status)"
req GET "$B/$FILE/download" >/dev/null
check "downloaded bytes match the upload" true "$(curl -s "$(field data.url)" | cmp -s - "$TMP/upload.png" && echo true || echo false)"
check "tampered signed URL is refused by storage" 403 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H 'Content-Type: image/png' --data-binary @"$TMP/upload.png" "${URL/X-Amz-Expires=300/X-Amz-Expires=3000}")"
req POST $B '{"filename":"small.png","contentType":"image/png","sizeBytes":10}' >/dev/null
LIAR=$(field data.file.id); curl -s -o /dev/null -X PUT -H 'Content-Type: image/png' --data-binary @"$TMP/upload.png" "$(field data.upload.url)"
check "file bigger than declared → 422 and removed" 422 "$(req POST "$B/$LIAR/complete")"
check "cleanup abandoned endpoint → 200" 200 "$(req POST localhost:4039/api/files/cleanup-abandoned)"
stop

# ---- Day 40 ----------------------------------------------------------------
echo "== Day 40 (email queue + worker)"
export REDIS_URL="redis://127.0.0.1:$QUEUE_REDIS_PORT" SMTP_HOST=127.0.0.1 SMTP_PORT="$MAILPIT_SMTP_PORT"
start day_40_email_notifications_queue 4040; B=localhost:4040/api/emails
check "accepted for delivery → 202" 202 "$(curl -s -o "$TMP/body" -w '%{http_code}' -X POST $B -H 'Content-Type: application/json' -H 'Idempotency-Key: smoke-welcome-0001' -d '{"type":"welcome","to":"ada@example.com","data":{"name":"Ada"}}')"
JOB=$(field data.jobId)
check "no worker yet: the job waits in Redis" waiting "$(req GET "$B/$JOB" >/dev/null; field data.state)"
check "dead-letter list endpoint → 200" 200 "$(req GET localhost:4040/api/admin/emails/failed)"
(cd "$DEMOS/day_40_email_notifications_queue" && exec node dist/worker.js >"$TMP/worker.log" 2>&1) &
WORKER_PID=$!
for _ in $(seq 1 50); do req GET "$B/$JOB" >/dev/null; [ "$(field data.state)" = completed ] && break; sleep 0.2; done
check "worker delivered it" completed "$(field data.state)"
check "email arrived in the inbox (Mailpit)" true "$(curl -s "localhost:$MAILPIT_HTTP_PORT/api/v1/messages" | grep -q 'Welcome, Ada!' && echo true || echo false)"
check "same Idempotency-Key → not queued again" true "$(curl -s -o "$TMP/body" -X POST $B -H 'Content-Type: application/json' -H 'Idempotency-Key: smoke-welcome-0001' -d '{"type":"welcome","to":"ada@example.com","data":{"name":"Ada"}}'; field data.duplicate)"
kill -TERM "$WORKER_PID"; wait "$WORKER_PID"; check "worker shuts down cleanly" 0 "$?"; WORKER_PID=""
stop

# ---- Day 41 ----------------------------------------------------------------
echo "== Day 41 (signed webhooks)"
export DATABASE_URL="$PG/day41" WEBHOOK_SECRET="whsec_smoke_only_secret_at_least_32_chars"
migrate day_41_webhook_endpoints
start day_41_webhook_endpoints 4041; B=localhost:4041/api
req POST $B/orders '{"amountCents":4999}' >/dev/null; ORDER41=$(field data.id)
webhook() { # type eventId [secret]
  local body="{\"id\":\"$2\",\"type\":\"$1\",\"data\":{\"orderId\":\"$ORDER41\",\"amountCents\":4999}}"
  local sig; sig=$(cd "$DEMOS/day_41_webhook_endpoints" && node -e "console.log(require('./dist/webhooks/signature').signatureHeader(process.argv[1], process.argv[2]))" "${3:-$WEBHOOK_SECRET}" "$body")
  curl -s -o "$TMP/body" -w '%{http_code}' -X POST "$B/webhooks/payments" -H 'Content-Type: application/json' -H "Webhook-Signature: $sig" --data-binary "$body"
}
check "forged signature → 401" 401 "$(webhook payment.succeeded evt_forged wrong-secret-wrong-secret-wrong-secret)"
check "signed event → processed" processed "$(webhook payment.succeeded evt_smoke_1 >/dev/null; field data.status)"
check "order is PAID" PAID "$(req GET "$B/orders/$ORDER41" >/dev/null; field data.status)"
check "redelivery → duplicate" duplicate "$(webhook payment.succeeded evt_smoke_1 >/dev/null; field data.status)"
check "late payment.failed can't undo PAID" PAID "$(webhook payment.failed evt_smoke_2 >/dev/null; req GET "$B/orders/$ORDER41" >/dev/null; field data.status)"
check "events stored once each" 2 "$(docker exec "$PG_CONTAINER" psql -U postgres -d day41 -tAc 'SELECT count(*) FROM webhook_events')"
stop

# ---- Day 42 ----------------------------------------------------------------
echo "== Day 42 (API versioning)"
start day_42_api_versioning_uri 4042
check "v1 announces deprecation" true "$(req GET localhost:4042/api/v1/products >/dev/null; [ -n "$(header deprecation)" ] && [ -n "$(header sunset)" ] && echo true || echo false)"
check "v2 price object" 39.99 "$(req GET localhost:4042/api/v2/products/p-1 >/dev/null; field data.price.amount)"
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

echo
[ "$FAIL" = 0 ] && echo "PHASE 2 SMOKE CHECKS PASSED" || echo "PHASE 2 SMOKE CHECKS FAILED"
exit "$FAIL"
