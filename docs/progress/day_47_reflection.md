# Day 47 - GitHub Actions CI Hardening

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Turn the CI workflow into a pipeline that's fast, safe and informative — and make it build and test the Day 46 production image.

## Key Learnings
- `concurrency` with `cancel-in-progress` stops stale runs when I push again
- `permissions: contents: read` — least privilege for the workflow token
- Timeouts on every job, and `fail-fast: false` so both Node versions always report
- Coverage: a summary table in the run's job summary, and full reports uploaded as artifacts
- Three jobs: `verify` (Node 20/24), `smoke` (real Postgres/MongoDB/Redis + Testcontainers) and `docker` (image build + compose stack)
- Docker layer caching between runs with `cache-from/cache-to: type=gha`

## Tech Stack Used
- **GitHub Actions**
- **docker/build-push-action**, Buildx
- **pnpm**, **Jest** coverage (`json-summary`)

## Project Structure (Day 47)
```
.github/workflows/ci-cd.yml   ← verify → smoke, docker
scripts/coverage-summary.mjs  ← Markdown coverage table for the job summary
scripts/smoke-test.sh         ← real-database checks (Days 26–49)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| — | `—` | No API today: this day is about the pipeline |

## How to Run
```bash
node scripts/coverage-summary.mjs   # after pnpm test:coverage — same table CI shows
```

### Challenges Faced & Solved
- The `docker` job builds with Buildx and then runs `docker compose up --no-build` so the cached image is used instead of rebuilding
- The compose credentials come from job-level `env:` because there's no `.env` file in CI

### Next Steps
- Add `docker` to the required status checks on `main`
- Day 49: validate configuration per environment
