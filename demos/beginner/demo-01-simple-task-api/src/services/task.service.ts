import { TaskModel } from '../models/task.model.js';

export const TaskService = {
  getAllTasks: () => TaskModel.findAll(),

  getTaskById: (id: number) => TaskModel.findById(id),

  createTask: (title: string, description?: string) =>
    TaskModel.create(title, description),

  updateTask: (id: number, updates: any) => TaskModel.update(id, updates),

  deleteTask: (id: number) => TaskModel.delete(id),
};