import { randomUUID } from 'node:crypto';
import type { NewTask, Task, TaskChanges, TaskStatus } from '../domain/task';
import type { TaskRepository } from './task.repository';

/**
 * A real implementation backed by a Map — used by the tests instead of mocking Prisma.
 * Tests exercise actual behaviour (state changes are visible to later calls) rather than
 * asserting which ORM methods were called.
 */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async list(filter: { status?: TaskStatus } = {}): Promise<Task[]> {
    const byDueDateThenNewest = (a: Task, b: Task) =>
      (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity) ||
      b.createdAt.getTime() - a.createdAt.getTime();
    return [...this.tasks.values()]
      .filter((t) => !filter.status || t.status === filter.status)
      .sort(byDueDateThenNewest);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(data: NewTask): Promise<Task> {
    const now = this.now();
    const task: Task = {
      id: randomUUID(),
      title: data.title,
      description: data.description ?? null,
      status: 'TODO',
      dueDate: data.dueDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, changes: TaskChanges): Promise<Task> {
    const existing = this.tasks.get(id);
    if (!existing) throw new Error(`Task ${id} not found`);
    const updated = { ...existing, ...changes, updatedAt: this.now() };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }
}
