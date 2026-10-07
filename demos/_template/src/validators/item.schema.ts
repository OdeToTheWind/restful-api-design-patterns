import { z } from 'zod';

// Whitelist of client-settable fields — unknown keys are stripped by validateBody
export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateItemSchema = createItemSchema.partial();

// Prisma's @default(cuid()) ids — malformed ids fail with 400 before reaching the database
export const itemIdParamsSchema = z.object({ id: z.string().cuid() });

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
