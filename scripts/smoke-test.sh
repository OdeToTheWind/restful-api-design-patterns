#!/usr/bin/env bash
# Smoke test runner: orchestrates full or phase-based smoke tests against real infrastructure.
#
# Usage:
#   pnpm smoke             # Run all phases (core, services, advanced)
#   pnpm smoke:phase1      # Run Phase 1 (Days 26–33)
#   pnpm smoke:phase2      # Run Phase 2 (Days 34–43)
#   pnpm smoke:phase3      # Run Phase 3 (Days 44–50)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"

case "$TARGET" in
  beginner)
    exec "$SCRIPT_DIR/smoke/beginner-smoke.sh"
    ;;
  phase1|core)
    exec "$SCRIPT_DIR/smoke/phase-1-core.sh"
    ;;
  phase2|services)
    exec "$SCRIPT_DIR/smoke/phase-2-services.sh"
    ;;
  phase3|advanced)
    exec "$SCRIPT_DIR/smoke/phase-3-advanced.sh"
    ;;
  all|"")
    echo "Running all smoke test phases in sequence..."
    "$SCRIPT_DIR/smoke/beginner-smoke.sh" || exit 1
    "$SCRIPT_DIR/smoke/phase-1-core.sh" || exit 1
    "$SCRIPT_DIR/smoke/phase-2-services.sh" || exit 1
    "$SCRIPT_DIR/smoke/phase-3-advanced.sh" || exit 1
    echo
    echo "========================================================"
    echo " ALL SMOKE CHECKS ACROSS ALL PHASES PASSED SUCCESSFULLY"
    echo "========================================================"
    ;;
  *)
    echo "Unknown smoke test target: $TARGET"
    echo "Valid options: all, beginner, phase1 (core), phase2 (services), phase3 (advanced)"
    exit 1
    ;;
esac
