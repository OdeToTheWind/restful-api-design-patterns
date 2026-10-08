import { z } from 'zod';

const paymentData = z.object({ orderId: z.string().cuid(), amountCents: z.number().int().min(0) });

/** Events we act on. Anything else is acknowledged (200) and ignored, so the provider stops retrying. */
export const paymentEventSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().min(1).max(100), type: z.literal('payment.succeeded'), data: paymentData }),
  z.object({ id: z.string().min(1).max(100), type: z.literal('payment.failed'), data: paymentData }),
]);
export const anyEventSchema = z
  .object({ id: z.string().min(1).max(100), type: z.string().min(1).max(100) })
  .passthrough();

export type PaymentEvent = z.infer<typeof paymentEventSchema>;
