import type { Task } from '../types/index.js';

let tasks: Task[] = [];
let idCounter = 1;

export const TaskModel = {
  findAll: (): Task[] => tasks,

  findById: (id: number): Task | undefined =>
    tasks.find(task => task.id === id),

  create: (title: string, description?: string): Task => {
    const newTask: Task = {
      id: idCounter++,
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tasks.push(newTask);
    return newTask;
  },

  update: (id: number, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    Object.assign(task, { ...updates, updatedAt: new Date() });
    return task;
  },

  delete: (id: number): boolean => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },
};