import { Request, Response } from 'express';
import { Task } from '../types/task.types';

let tasks: Task[] = [];

export class TaskController {
  // 200 OK
  static getAllTasks(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
      count: tasks.length
    });
  }

  // 200 OK or 404 Not Found
  static getTaskById(req: Request, res: Response) {
    const { id } = req.params;
    const task = tasks.find(t => t.id === parseInt(id));

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, data: task });
  }

  // 201 Created
  static createTask(req: Request, res: Response) {
    const { title, priority = 'medium' } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: "Title is required" });
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title,
      status: 'pending',
      priority,
      createdAt: new Date()
    };

    tasks.push(newTask);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask
    });
  }

  // 200 OK or 404
  static updateTask(req: Request, res: Response) {
    const { id } = req.params;
    const index = tasks.findIndex(t => t.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    tasks[index] = { ...tasks[index], ...req.body };
    res.status(200).json({ success: true, message: "Task updated", data: tasks[index] });
  }

  // 204 No Content
  static deleteTask(req: Request, res: Response) {
    const { id } = req.params;
    const index = tasks.findIndex(t => t.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    tasks.splice(index, 1);
    res.status(204).send(); // No Content
  }

  // 400 Bad Request
  static completeTask(req: Request, res: Response) {
    const { id } = req.params;
    const task = tasks.find(t => t.id === parseInt(id));

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    if (task.status === 'completed') {
      res.status(400).json({ success: false, error: "Task is already completed" });
      return;
    }

    task.status = 'completed';
    res.status(200).json({ success: true, message: "Task marked as completed", data: task });
  }

  // 500 Internal Server Error (Demo)
  static simulateServerError(req: Request, res: Response) {
    try {
      throw new Error("Simulated database failure");
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Something went wrong on our end"
      });
    }
  }
}