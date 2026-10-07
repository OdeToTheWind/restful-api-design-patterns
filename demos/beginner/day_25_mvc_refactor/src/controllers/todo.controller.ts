import { Request, Response } from 'express';
import { TodoModel } from '../models/Todo.model';
import { ApiResponse } from '../utils/response.util';

const todoModel = new TodoModel();

export class TodoController {
  static getAll(req: Request, res: Response) {
    const todos = todoModel.getAll();
    ApiResponse.success(res, todos, "Todos fetched successfully");
  }

  static create(req: Request, res: Response) {
    const { title } = req.body;
    if (!title) return ApiResponse.error(res, "Title is required", 400);

    const todo = todoModel.create(title);
    ApiResponse.success(res, todo, "Todo created successfully", 201);
  }

  static update(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const todo = todoModel.update(parseInt(id), updates);

    if (!todo) return ApiResponse.error(res, "Todo not found", 404);

    ApiResponse.success(res, todo, "Todo updated successfully");
  }

  static delete(req: Request, res: Response) {
    const { id } = req.params;
    const success = todoModel.delete(parseInt(id));

    if (!success) return ApiResponse.error(res, "Todo not found", 404);

    ApiResponse.success(res, null, "Todo deleted successfully");
  }
}