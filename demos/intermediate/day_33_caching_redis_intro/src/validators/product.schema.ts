import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  priceCents: z.number().int().min(0),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

export const productIdParamsSchema = z.object({ id: z.string().cuid() });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
