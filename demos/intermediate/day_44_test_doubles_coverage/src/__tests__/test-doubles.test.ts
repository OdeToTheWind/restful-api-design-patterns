/**
 * The same CheckoutService, tested with each kind of test double — chosen by what the test
 * needs to know, not by habit:
 *   dummy — passed only because the signature requires it; never used
 *   stub  — returns canned answers so the code under test can run (a fixed clock)
 *   spy   — records calls so the test can look at them afterwards
 *   mock  — an expectation about an interaction, checked by the test ("refund exactly once")
 *   fake  — a real, simplified implementation (in-memory inventory and repository)
 */
import { AppError } from '@restful/shared';
import { InMemoryInventory, InMemoryOrderRepository } from '../adapters/in-memory';
import { CheckoutService, type CheckoutDeps } from '../checkout/checkout.service';
import type { Clock, Mailer, PaymentGateway } from '../checkout/ports';

// STUB: always the same instant, outside happy hour — results are deterministic
const stubClock = (iso = '2026-10-08T10:00:00Z'): Clock => ({ now: () => new Date(iso) });

// STUB: a gateway that always approves with a canned id
const approvingGateway = (): PaymentGateway & { charge: jest.Mock; refund: jest.Mock } => ({
  charge: jest.fn().mockResolvedValue({ chargeId: 'ch_test_1' }),
  refund: jest.fn().mockResolvedValue(undefined),
});

// DUMMY: required by the constructor, irrelevant to tests that fail before emailing
const dummyMailer: Mailer = {
  sendReceipt: () => {
    throw new Error('the dummy mailer should never be called in this test');
  },
};

const build = (overrides: Partial<CheckoutDeps> = {}) => {
  const deps: CheckoutDeps = {
    payments: approvingGateway(),
    inventory: new InMemoryInventory(
      new Map([
        ['BOOK-REST', 5],
        ['MUG-API', 1],
      ]),
    ), // FAKE
    orders: new InMemoryOrderRepository(), // FAKE
    mailer: { sendReceipt: jest.fn().mockResolvedValue(undefined) },
    clock: stubClock(),
    ...overrides,
  };
  return { service: new CheckoutService(deps), deps };
};

const input = { email: 'ada@example.com', items: [{ sku: 'BOOK-REST', quantity: 2 }], cardToken: 'tok_ok' };

describe('fakes: real behaviour, observed through state', () => {
  it('a successful checkout reserves stock and stores the order', async () => {
    const inventory = new InMemoryInventory(new Map([['BOOK-REST', 5]]));
    const { service } = build({ inventory });

    const order = await service.checkout(input);

    expect(inventory.available('BOOK-REST')).toBe(3);
    expect(await service.get(order.id)).toEqual(order);
  });

  it('when one item is out of stock, items reserved earlier are released (state is back to before)', async () => {
    const inventory = new InMemoryInventory(
      new Map([
        ['BOOK-REST', 5],
        ['MUG-API', 1],
      ]),
    );
    const { service } = build({ inventory, mailer: dummyMailer });

    await expect(
      service.checkout({
        ...input,
        items: [
          { sku: 'BOOK-REST', quantity: 2 },
          { sku: 'MUG-API', quantity: 3 },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(inventory.available('BOOK-REST')).toBe(5);
    expect(inventory.available('MUG-API')).toBe(1);
  });
});

describe('stubs: controlling inputs the code depends on', () => {
  it('a declined card (stubbed gateway) is a 402 and releases the stock', async () => {
    const inventory = new InMemoryInventory(new Map([['BOOK-REST', 5]]));
    const declining: PaymentGateway = { charge: () => Promise.reject(new Error('declined')), refund: jest.fn() };
    const { service } = build({ payments: declining, inventory, mailer: dummyMailer });

    await expect(service.checkout(input)).rejects.toMatchObject({ statusCode: 402 });
    expect(inventory.available('BOOK-REST')).toBe(5);
  });

  it('the stubbed clock makes the time-dependent discount testable', async () => {
    const { service } = build({ clock: stubClock('2026-10-08T17:30:00Z') });
    const order = await service.checkout(input);
    expect(order).toMatchObject({ subtotalCents: 7998, discountCents: 800, totalCents: 7198 });
  });
});

describe('spies: checking what was sent out', () => {
  it('charges the discounted total and emails the receipt to the customer', async () => {
    const { service, deps } = build();
    const order = await service.checkout(input);

    expect(deps.payments.charge).toHaveBeenCalledWith(7998, 'tok_ok');
    expect(deps.mailer.sendReceipt).toHaveBeenCalledWith('ada@example.com', order);
  });

  it('a failing receipt email does not fail the checkout', async () => {
    const { service } = build({ mailer: { sendReceipt: jest.fn().mockRejectedValue(new Error('SMTP down')) } });
    await expect(service.checkout(input)).resolves.toMatchObject({ totalCents: 7998 });
  });
});

describe('mocks: verifying a required interaction', () => {
  it('if saving the order fails after charging, the charge is refunded exactly once', async () => {
    const payments = approvingGateway();
    const brokenOrders = { save: jest.fn().mockRejectedValue(new Error('db down')), findById: jest.fn() };
    const { service } = build({ payments, orders: brokenOrders, mailer: dummyMailer });

    await expect(service.checkout(input)).rejects.toThrow('db down');

    expect(payments.refund).toHaveBeenCalledTimes(1);
    expect(payments.refund).toHaveBeenCalledWith('ch_test_1');
  });

  it('a declined payment is never refunded (there is nothing to refund)', async () => {
    const payments = approvingGateway();
    payments.charge.mockRejectedValue(new Error('declined'));
    const { service } = build({ payments, mailer: dummyMailer });

    await expect(service.checkout(input)).rejects.toBeInstanceOf(AppError);
    expect(payments.refund).not.toHaveBeenCalled();
  });
});
