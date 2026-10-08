import { z } from 'zod';

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({ sku: z.string().trim().toUpperCase().min(1).max(40), quantity: z.number().int().min(1).max(100) }),
    )
    .min(1)
    .max(20),
  cardToken: z.string().min(1).max(200),
});

export const orderIdParamsSchema = z.object({ id: z.string().uuid() });
export const debugLogsQuery = z.object({ requestId: z.string().max(64).optional() });
