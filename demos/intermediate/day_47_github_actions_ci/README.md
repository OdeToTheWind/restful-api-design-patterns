# Day 47 - GitHub Actions CI Hardening

This day has no application code: the work lives in the pipeline.

- Workflow: [`.github/workflows/ci-cd.yml`](../../../.github/workflows/ci-cd.yml)
- Coverage table: [`scripts/coverage-summary.mjs`](../../../scripts/coverage-summary.mjs)
- Real-database checks: [`scripts/smoke-test.sh`](../../../scripts/smoke-test.sh)
- Notes: [`docs/progress/day_47_reflection.md`](../../../docs/progress/day_47_reflection.md)

| Job | What it proves |
|---|---|
| `verify` (Node 20 + 24) | audit, type-check, lint, formatting, 300+ tests with coverage gates |
| `smoke` | every intermediate demo against real PostgreSQL, MongoDB and Redis; Day 45's Testcontainers suite |
| `docker` | the Day 46 production image builds, the compose stack becomes healthy, the API works and shuts down cleanly |
