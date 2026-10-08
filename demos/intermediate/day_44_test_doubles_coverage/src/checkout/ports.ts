/**
 * The checkout service's collaborators, as interfaces ("ports"). Each one is something a test
 * may want to replace: it's slow, external, non-deterministic, or has side effects.
 */
export interface PaymentGateway {
  charge(amountCents: number, cardToken: string): Promise<{ chargeId: string }>;
  refund(chargeId: string): Promise<void>;
}

export interface Inventory {
  /** false when there isn't enough stock */
  reserve(sku: string, quantity: number): Promise<boolean>;
  release(sku: string, quantity: number): Promise<void>;
}

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | undefined>;
}

export interface Mailer {
  sendReceipt(to: string, order: Order): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface Order {
  id: string;
  email: string;
  items: Array<{ sku: string; quantity: number }>;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  chargeId: string;
  createdAt: string;
}
