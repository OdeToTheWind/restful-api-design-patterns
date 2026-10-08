import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  items: z
    .array(z.object({ sku: z.string().trim().toUpperCase().min(1).max(40), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
  cardToken: z.string().min(1).max(200),
});
export const orderIdParamsSchema = z.object({ id: z.string().uuid() });
