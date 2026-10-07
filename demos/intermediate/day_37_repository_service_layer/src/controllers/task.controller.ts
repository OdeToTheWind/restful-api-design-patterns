import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import type { TaskStatus } from '../domain/task';
import type { TaskService } from '../services/task.service';

/** HTTP only: read the (already validated) request, call the service, shape the response. */
export const createTaskController = (tasks: TaskService) => ({
  list: async (req: Request, res: Response) => {
    const { status } = req.query as { status?: TaskStatus };
    ApiResponse.success(res, await tasks.list(status), 'Tasks fetched successfully');
  },
  get: async (req: Request, res: Response) => {
    ApiResponse.success(res, await tasks.get(req.params.id), 'Task fetched successfully');
  },
  create: async (req: Request, res: Response) => {
    ApiResponse.success(res, await tasks.create(req.body), 'Task created successfully', 201);
  },
  edit: async (req: Request, res: Response) => {
    ApiResponse.success(res, await tasks.edit(req.params.id, req.body), 'Task updated successfully');
  },
  transition: async (req: Request, res: Response) => {
    ApiResponse.success(res, await tasks.transition(req.params.id, req.body.status), 'Task status updated');
  },
  remove: async (req: Request, res: Response) => {
    await tasks.remove(req.params.id);
    ApiResponse.success(res, null, 'Task deleted successfully');
  },
});
