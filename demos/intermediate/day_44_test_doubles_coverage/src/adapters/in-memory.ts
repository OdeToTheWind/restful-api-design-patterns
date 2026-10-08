import { randomUUID } from 'node:crypto';
import { logger } from '@restful/shared';
import type { Clock, Inventory, Mailer, Order, OrderRepository, PaymentGateway } from '../checkout/ports';

/**
 * Working, simplified implementations ("fakes"). The demo app runs on them, and tests use
 * them wherever real behaviour matters more than checking a particular call.
 */
export class InMemoryInventory implements Inventory {
  constructor(
    private readonly stock: Map<string, number> = new Map([
      ['BOOK-REST', 10],
      ['BOOK-DDD', 3],
      ['MUG-API', 25],
    ]),
  ) {}

  async reserve(sku: string, quantity: number) {
    const available = this.stock.get(sku) ?? 0;
    if (available < quantity) return false;
    this.stock.set(sku, available - quantity);
    return true;
  }

  async release(sku: string, quantity: number) {
    this.stock.set(sku, (this.stock.get(sku) ?? 0) + quantity);
  }

  available(sku: string) {
    return this.stock.get(sku) ?? 0;
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  async save(order: Order) {
    this.orders.set(order.id, order);
  }
  async findById(id: string) {
    return this.orders.get(id);
  }
}

/** Declines card tokens that start with tok_declined, like a payment sandbox */
export class SandboxPaymentGateway implements PaymentGateway {
  async charge(_amountCents: number, cardToken: string) {
    if (cardToken.startsWith('tok_declined')) throw new Error('card declined');
    return { chargeId: `ch_${randomUUID()}` };
  }
  async refund(chargeId: string) {
    logger.info('refunded', { chargeId });
  }
}

export class LogMailer implements Mailer {
  async sendReceipt(to: string, order: Order) {
    logger.info('receipt sent', { to, orderId: order.id });
  }
}

export const systemClock: Clock = { now: () => new Date() };
