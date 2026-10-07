import { z } from 'zod';
import { TASK_STATUSES } from '../domain/task';

const fields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
};

export const createTaskSchema = z.object(fields);
export const editTaskSchema = z
  .object(fields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });
export const transitionSchema = z.object({ status: z.enum(TASK_STATUSES) });
export const listTasksQuery = z.object({ status: z.enum(TASK_STATUSES).optional() });
export const taskIdParamsSchema = z.object({ id: z.string().min(1).max(64) });
