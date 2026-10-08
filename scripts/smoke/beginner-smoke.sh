#!/usr/bin/env bash
# Smoke test for Beginner phase (Days 1–25): boots each demo and verifies the root endpoint.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEMOS="$ROOT/demos/beginner"
FAIL=0

echo "========================================================"
echo " Running Smoke Test — Beginner (Days 1–25)"
echo "========================================================"

for dir in "$DEMOS"/day_*; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  day_num=$(echo "$name" | grep -oE '[0-9]+' | head -1 | sed 's/^0*//')
  port=$((5000 + day_num))

  if [ ! -f "$dir/dist/index.js" ]; then
    echo "  FAIL $name: missing dist/index.js (run 'pnpm build' first)"
    FAIL=1
    continue
  fi

  PORT="$port" node "$dir/dist/index.js" >/dev/null 2>&1 &
  PID=$!

  # Poll up to 5 seconds
  passed=false
  code=""
  for _ in $(seq 1 25); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port/" || true)
    if [ "$code" = "200" ]; then
      passed=true
      break
    fi
    sleep 0.2
  done

  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true

  if [ "$passed" = true ]; then
    echo "  PASS $name (port $port) → 200"
  else
    echo "  FAIL $name (port $port) did not respond with 200 (got '$code')"
    FAIL=1
  fi
done

echo
[ "$FAIL" = 0 ] && echo "BEGINNER SMOKE CHECKS PASSED" || echo "BEGINNER SMOKE CHECKS FAILED"
exit "$FAIL"
