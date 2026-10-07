import { Request, Response } from 'express';
import { Todo } from '../types/todo.types';

let todos: Todo[] = [];

export class TodoController {
  static getAllTodos(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Todos fetched successfully",
      data: todos,
      count: todos.length
    });
  }

  static getTodoById(req: Request, res: Response) {
    const { id } = req.params;
    const todo = todos.find(t => t.id === parseInt(id));

    if (!todo) {
      res.status(404).json({ success: false, error: "Todo not found" });
      return;
    }

    res.json({ success: true, message: "Todo found", data: todo });
  }

  static createTodo(req: Request, res: Response) {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: "Title is required" });
      return;
    }

    const newTodo: Todo = {
      id: Date.now(),
      title,
      completed: false,
      createdAt: new Date()
    };

    todos.push(newTodo);

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: newTodo
    });
  }

  static updateTodo(req: Request, res: Response) {
    const { id } = req.params;
    const { title, completed } = req.body;
    const todoIndex = todos.findIndex(t => t.id === parseInt(id));

    if (todoIndex === -1) {
      res.status(404).json({ success: false, error: "Todo not found" });
      return;
    }

    todos[todoIndex] = { ...todos[todoIndex], title, completed };

    res.json({
      success: true,
      message: "Todo updated successfully",
      data: todos[todoIndex]
    });
  }

  static deleteTodo(req: Request, res: Response) {
    const { id } = req.params;
    const todoIndex = todos.findIndex(t => t.id === parseInt(id));

    if (todoIndex === -1) {
      res.status(404).json({ success: false, error: "Todo not found" });
      return;
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];

    res.json({
      success: true,
      message: "Todo deleted successfully",
      data: deletedTodo
    });
  }
}