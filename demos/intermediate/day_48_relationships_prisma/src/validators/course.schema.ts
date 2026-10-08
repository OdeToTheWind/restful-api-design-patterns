import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  lessons: z
    .array(z.object({ title: z.string().trim().min(1).max(200), durationMinutes: z.number().int().min(1).max(600) }))
    .max(100)
    .default([]),
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]{1,30}$/),
    )
    .max(10)
    .default([])
    .transform((tags) => [...new Set(tags)]),
});
export const createStudentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
});
export const enrollSchema = z.object({ studentId: z.string().cuid() });
export const idParamsSchema = z.object({ id: z.string().cuid() });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
