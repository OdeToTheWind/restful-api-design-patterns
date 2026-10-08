import { z } from 'zod';

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,30}$/, 'tags are 1–30 chars: a-z, 0-9, -');

export const createBookmarkSchema = z.object({
  url: z.string().trim().url().max(2000),
  title: z.string().trim().min(1).max(200),
  // Duplicates removed so the stored array is a clean set
  tags: z
    .array(tag)
    .max(10)
    .default([])
    .transform((tags) => [...new Set(tags)]),
});

export const listBookmarksQuery = z.object({
  // ?tag=a&tag=b → bookmarks having ALL of them
  tag: z
    .union([tag, z.array(tag)])
    .optional()
    .transform((value) => (value === undefined ? [] : Array.isArray(value) ? value : [value])),
});

export const bookmarkIdParamsSchema = z.object({ id: z.string().cuid() });

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type ListBookmarksQuery = z.infer<typeof listBookmarksQuery>;
