import { z } from 'zod';

/** Every email the system can send — a discriminated union on `type` */
export const emailRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('welcome'),
    to: z.string().trim().toLowerCase().email(),
    data: z.object({ name: z.string().trim().min(1).max(100) }),
  }),
  z.object({
    type: z.literal('order-confirmation'),
    to: z.string().trim().toLowerCase().email(),
    data: z.object({ orderId: z.string().min(1).max(64), totalCents: z.number().int().min(0) }),
  }),
]);

export type EmailRequest = z.infer<typeof emailRequestSchema>;

export const jobIdParamsSchema = z.object({ jobId: z.string().min(1).max(200) });
// Idempotency keys are client-chosen; keep them plain so they're safe as job ids
export const idempotencyKeySchema = z.string().regex(/^[\w-]{8,100}$/);
