# Day 44 - Test Doubles and Coverage

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Use the **right kind of test double** for each job, and see why high coverage doesn't mean correct code.

## Key Learnings
- Dummy: required by the signature, never used
- Stub: canned answers (a fixed clock, an approving or declining gateway)
- Spy: records calls to inspect afterwards (what was charged, who got the receipt)
- Mock: a required interaction ("refund exactly once when saving fails after charging")
- Fake: a working in-memory implementation (inventory, repository) — test state, not calls
- Coverage shows which lines ran, not whether they're right: two tests reach 100% of the discount rule and still pass for two buggy versions; boundary tests catch both

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Jest** (mocks, spies)

## Project Structure (Day 44)
```
src/checkout/ports.ts             ← collaborator interfaces
src/checkout/checkout.service.ts  ← reserve → charge → save → email, with compensation
src/adapters/in-memory.ts         ← fakes (also what the demo runs on)
src/__tests__/test-doubles.test.ts
src/__tests__/coverage-is-not-enough.test.ts
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Reserve, charge, save, email |
| GET | `/api/orders/:id` | An order |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_44_test_doubles_coverage
cp .env.example .env
pnpm dev
pnpm test
```

### Challenges Faced & Solved
- Compensation is the interesting logic: release reservations when stock or payment fails, refund when saving fails after charging
- A receipt email failure must not fail the checkout — the customer has paid

### Next Steps
- Day 48: relationships
