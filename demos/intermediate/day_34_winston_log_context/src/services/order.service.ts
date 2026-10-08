import { randomUUID } from 'node:crypto';
import { AppError, logger } from '@restful/shared';

export interface OrderInput {
  items: Array<{ sku: string; quantity: number }>;
  cardToken: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderInput['items'];
  totalCents: number;
  status: 'PAID';
  createdAt: string;
}

const PRICES: Record<string, number> = { 'BOOK-REST': 3999, 'BOOK-DDD': 5499, 'MUG-API': 1299 };

/**
 * Logs freely without being handed a request id or user: the shared logger adds them from
 * the request context. A child logger adds the static `component` field to every line.
 */
export class OrderService {
  private readonly log = logger.child({ component: 'order-service' });
  private readonly orders = new Map<string, Order>();

  async place(userId: string, input: OrderInput): Promise<Order> {
    this.log.debug('validating items', { items: input.items.length });
    const unknown = input.items.find((item) => !(item.sku in PRICES));
    if (unknown) {
      this.log.warn('unknown sku', { sku: unknown.sku });
      throw new AppError('Validation failed', 400, { items: [`unknown sku ${unknown.sku}`] });
    }

    const totalCents = input.items.reduce((sum, item) => sum + PRICES[item.sku] * item.quantity, 0);
    // cardToken is redacted by the shared logger — it never reaches the log output
    this.log.info('charging card', { totalCents, cardToken: input.cardToken });
    await this.charge(input.cardToken, totalCents);

    const order: Order = {
      id: randomUUID(),
      userId,
      items: input.items,
      totalCents,
      status: 'PAID',
      createdAt: new Date().toISOString(),
    };
    this.orders.set(order.id, order);
    this.log.info('order placed', { orderId: order.id, totalCents });
    return order;
  }

  get(userId: string, id: string): Order {
    const order = this.orders.get(id);
    if (!order || order.userId !== userId) throw new AppError('Order not found', 404);
    return order;
  }

  /** Stand-in for a payment provider: tokens starting with tok_declined are refused */
  private async charge(cardToken: string, amountCents: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (cardToken.startsWith('tok_declined')) {
      this.log.warn('payment declined', { amountCents });
      throw new AppError('Payment declined', 402);
    }
  }
}
