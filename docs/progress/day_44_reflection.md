# Day 44 - Test Doubles Taxonomy & The Coverage Illusion

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Master the distinct categories of **test doubles** (dummies, stubs, spies, mocks, fakes) in TypeScript, apply compensating actions during checkout failures, and empirically demonstrate why 100% line coverage does not guarantee software correctness.

## Key Learnings
- **Taxonomy of Test Doubles**:
  - **Dummy**: Values passed purely to satisfy function parameters or type signatures; never called or inspected.
  - **Stub**: Collaborators returning canned responses (e.g. an exchange rate service returning a constant `1.25` or an inventory service returning `isAvailable: true`).
  - **Spy**: Wrappers that record invocation history (arguments, call counts, return values) for post-execution assertion.
  - **Mock**: Pre-programmed expectations that verify interactions directly (e.g. asserting that `paymentGateway.refund()` is invoked with exact parameters if database saving throws).
  - **Fake**: Working, lightweight in-memory implementations (e.g. an in-memory inventory ledger) that maintain state across calls; tests assert on resulting state rather than private internal method calls.
- **The Limits of Code Coverage**: High test coverage proves that code ran, not that the code is correct. I authored a dedicated test (`coverage-is-not-enough.test.ts`) showing that a pricing discount function reaches 100% statement, branch, and function coverage with just two test cases, yet allows negative amounts and mishandles tier boundaries until explicit edge-case boundary tests are introduced.
- **Compensating Transactions (Saga Pattern)**: In multi-step workflows like checkout (Reserve Stock → Charge Card → Save Order → Send Receipt):
  - If payment fails, stock reservations must be automatically released.
  - If saving the order fails after charging the card, a compensating refund must execute immediately.
- **Non-Fatal Side Effects**: Secondary operations (such as sending a customer confirmation email) must be isolated with try-catch handlers so that network hiccups in notification providers do not roll back a paid, fulfilled order.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Jest** (mocks, spies, assertions)
- **Supertest**

## Project Structure (Day 44)
```bash
day_44_test_doubles_coverage/
├── src/
│   ├── checkout/
│   │   ├── ports.ts                         # Interfaces for inventory, payment, repository, mailer
│   │   └── checkout.service.ts              # Multi-step checkout with compensation logic
│   ├── adapters/
│   │   └── in-memory.ts                     # In-memory test fakes for fast testing
│   ├── controllers/
│   │   └── checkout.controller.ts
│   ├── __tests__/
│   │   ├── test-doubles.test.ts             # Examples of dummy, stub, spy, mock, and fake
│   │   └── coverage-is-not-enough.test.ts   # Demonstration of coverage blind spots
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/checkout` | Coordinates stock reservation, payment charge, order saving, and receipt | 201 / 400 / 402 / 500 |
| GET | `/api/orders/:id` | Retrieves confirmed order record | 200 / 404 |

## Compensation Architecture in Checkout Service

```typescript
// src/checkout/checkout.service.ts
export class CheckoutService {
  constructor(
    private inventory: InventoryPort,
    private payment: PaymentPort,
    private orders: OrderRepositoryPort,
    private notification: NotificationPort
  ) {}

  async checkout(input: CheckoutInput): Promise<Order> {
    // 1. Reserve stock
    await this.inventory.reserve(input.items);

    let paymentId: string;
    try {
      // 2. Charge card
      paymentId = await this.payment.charge(input.amountCents, input.token);
    } catch (chargeErr) {
      // Compensate: release stock
      await this.inventory.release(input.items);
      throw chargeErr;
    }

    try {
      // 3. Persist order
      return await this.orders.save({ ...input, paymentId });
    } catch (saveErr) {
      // Compensate: refund payment and release stock
      await this.payment.refund(paymentId);
      await this.inventory.release(input.items);
      throw saveErr;
    }
  }
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_44_test_doubles_coverage
cp .env.example .env
pnpm dev

# Run unit tests and generate coverage report
pnpm test:coverage
```

### Challenges Faced & Solved
- **Testing State vs. Testing Implementation**: Excessive mocking of internal methods makes tests brittle, breaking whenever internal refactorings occur. Focusing assertions on fakes and observable boundary states rather than verifying every intermediate function call resulted in much more maintainable test suites.
- **Handling Non-Blocking Email Failures**: Formulated a clear test asserting that when the notification port throws a network error during the final receipt step, the checkout still succeeds with a 201 status because payment processing and order persistence were completed.

### Next Steps
- Execute full integration testing against ephemeral PostgreSQL instances using Testcontainers in Day 45.

---

**Status: ✅ Day 44 Successfully Completed**  
**Progress: 44/100 Days**  
**Milestone: Test doubles taxonomy mastered, compensating saga flows implemented, and coverage illusions dispelled with edge-case tests.**
