import { z } from 'zod';

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words separated by hyphens')
  .max(120);

export const createArticleSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20_000),
});
export const updateArticleSchema = createArticleSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });
export const articleIdParamsSchema = z.object({ id: z.string().cuid() });
export const articleSlugParamsSchema = z.object({ slug });

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
