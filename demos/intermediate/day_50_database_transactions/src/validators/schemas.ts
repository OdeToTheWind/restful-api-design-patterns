import { z } from 'zod';

export const createAccountSchema = z.object({
  owner: z.string().trim().min(1).max(100),
  initialBalanceCents: z.number().int().min(0).max(1_000_000_000).default(0),
});
export const updateAccountSchema = z.object({ owner: z.string().trim().min(1).max(100) });
export const transferSchema = z
  .object({ fromId: z.string().cuid(), toId: z.string().cuid(), amountCents: z.number().int().min(1).max(100_000_000) })
  .refine((body) => body.fromId !== body.toId, { message: 'Cannot transfer to the same account', path: ['toId'] });
export const idParamsSchema = z.object({ id: z.string().cuid() });
export const transfersQuery = z.object({ accountId: z.string().cuid().optional() });
export const idempotencyKey = z.string().regex(/^[\w-]{8,100}$/);
