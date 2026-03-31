import type { Request, Response } from 'express';
import { TaskService } from '../services/task.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const TaskController = {
  getAll: (req: Request, res: Response) => {
    const tasks = TaskService.getAllTasks();
    successResponse(res, "Tasks fetched successfully", tasks);
  },

  getById: (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const task = TaskService.getTaskById(id);

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }
    successResponse(res, "Task fetched successfully", task);
  },

  create: (req: Request, res: Response) => {
    try {
      const validated = createTaskSchema.parse(req.body);
      const task = TaskService.createTask(validated.title, validated.description);
      successResponse(res, "Task created successfully", task, 201);
    } catch (error: any) {
      errorResponse(res, "Invalid input", 400, error.message);
    }
  },

  update: (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const task = TaskService.updateTask(id, req.body);

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }
    successResponse(res, "Task updated successfully", task);
  },

  delete: (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const deleted = TaskService.deleteTask(id);

    if (!deleted) {
      return errorResponse(res, "Task not found", 404);
    }
    successResponse(res, "Task deleted successfully", null, 204);
  },
};