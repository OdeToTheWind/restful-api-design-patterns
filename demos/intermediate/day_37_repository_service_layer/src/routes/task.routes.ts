import { Router } from 'express';
import { asyncHandler, validateBody, validateParams, validateQuery } from '@restful/shared';
import { createTaskController } from '../controllers/task.controller';
import type { TaskService } from '../services/task.service';
import {
  createTaskSchema,
  editTaskSchema,
  listTasksQuery,
  taskIdParamsSchema,
  transitionSchema,
} from '../validators/task.schema';

export const createTaskRoutes = (tasks: TaskService): Router => {
  const router = Router();
  const controller = createTaskController(tasks);
  const validId = validateParams(taskIdParamsSchema);

  router.get('/', validateQuery(listTasksQuery), asyncHandler(controller.list));
  router.post('/', validateBody(createTaskSchema), asyncHandler(controller.create));
  router.get('/:id', validId, asyncHandler(controller.get));
  router.patch('/:id', validId, validateBody(editTaskSchema), asyncHandler(controller.edit));
  // Status changes are their own sub-resource: they follow workflow rules, unlike plain edits
  router.put('/:id/status', validId, validateBody(transitionSchema), asyncHandler(controller.transition));
  router.delete('/:id', validId, asyncHandler(controller.remove));

  return router;
};
