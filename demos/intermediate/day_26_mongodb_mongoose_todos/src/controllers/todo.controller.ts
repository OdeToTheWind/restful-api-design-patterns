import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse, AppError } from '@restful/shared';
import Todo from '../models/Todo.model';

export const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    completed: z.boolean(),
  })
  .partial();

// Errors thrown here (or rejected promises) are forwarded by asyncHandler in the routes
export class TodoController {
  static async getAll(req: Request, res: Response) {
    const todos = await Todo.find().sort({ createdAt: -1 });
    ApiResponse.success(res, todos, "Todos fetched successfully");
  }

  static async create(req: Request, res: Response) {
    const todo = await Todo.create(req.body);
    ApiResponse.success(res, todo, "Todo created successfully", 201);
  }

  static async update(req: Request, res: Response) {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!todo) throw new AppError("Todo not found", 404);

    ApiResponse.success(res, todo, "Todo updated successfully");
  }

  static async delete(req: Request, res: Response) {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) throw new AppError("Todo not found", 404);

    ApiResponse.success(res, null, "Todo deleted successfully");
  }
}
