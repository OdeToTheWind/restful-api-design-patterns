import { randomUUID } from 'node:crypto';
import { AppError, logger } from '@restful/shared';
import type { Clock, Inventory, Mailer, Order, OrderRepository, PaymentGateway } from './ports';

export const PRICES: Record<string, number> = { 'BOOK-REST': 3999, 'BOOK-DDD': 5499, 'MUG-API': 1299 };

export interface CheckoutInput {
  email: string;
  items: Array<{ sku: string; quantity: number }>;
  cardToken: string;
}

export interface CheckoutDeps {
  payments: PaymentGateway;
  inventory: Inventory;
  orders: OrderRepository;
  mailer: Mailer;
  clock: Clock;
}

/** Happy hour: 10% off for checkouts from 17:00:00 up to (not including) 18:00:00 UTC. */
export const happyHourDiscount = (subtotalCents: number, at: Date): number => {
  const hour = at.getUTCHours();
  return hour === 17 ? Math.round(subtotalCents * 0.1) : 0;
};

export class CheckoutService {
  constructor(private readonly deps: CheckoutDeps) {}

  /**
   * reserve stock → charge → save → email. If a later step fails, earlier side effects are
   * undone (compensation): reservations released, charge refunded. A failed receipt email
   * does NOT fail the checkout — the customer has paid and has an order.
   */
  async checkout(input: CheckoutInput): Promise<Order> {
    const { payments, inventory, orders, mailer, clock } = this.deps;

    const unknown = input.items.find((item) => !(item.sku in PRICES));
    if (unknown) throw new AppError('Validation failed', 400, { items: [`unknown sku ${unknown.sku}`] });

    const reserved: CheckoutInput['items'] = [];
    const releaseAll = () => Promise.all(reserved.map((item) => inventory.release(item.sku, item.quantity)));

    for (const item of input.items) {
      if (!(await inventory.reserve(item.sku, item.quantity))) {
        await releaseAll();
        throw new AppError(`Not enough stock for ${item.sku}`, 409);
      }
      reserved.push(item);
    }

    const subtotalCents = input.items.reduce((sum, item) => sum + PRICES[item.sku] * item.quantity, 0);
    const now = clock.now();
    const discountCents = happyHourDiscount(subtotalCents, now);
    const totalCents = subtotalCents - discountCents;

    let chargeId: string;
    try {
      ({ chargeId } = await payments.charge(totalCents, input.cardToken));
    } catch {
      await releaseAll();
      throw new AppError('Payment declined', 402);
    }

    const order: Order = {
      id: randomUUID(),
      email: input.email,
      items: input.items,
      subtotalCents,
      discountCents,
      totalCents,
      chargeId,
      createdAt: now.toISOString(),
    };

    try {
      await orders.save(order);
    } catch (error) {
      // The customer was charged but we have no order: give the money back
      await payments.refund(chargeId);
      await releaseAll();
      throw error;
    }

    try {
      await mailer.sendReceipt(order.email, order);
    } catch (error) {
      logger.warn('receipt email failed; order kept', { orderId: order.id, error: (error as Error).message });
    }
    return order;
  }

  async get(id: string): Promise<Order> {
    const order = await this.deps.orders.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }
}
