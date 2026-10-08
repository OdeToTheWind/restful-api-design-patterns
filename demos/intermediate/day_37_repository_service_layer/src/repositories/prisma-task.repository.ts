import type { PrismaClient } from '../../generated/prisma';
import type { NewTask, Task, TaskChanges, TaskStatus } from '../domain/task';
import type { TaskRepository } from './task.repository';

/** Production adapter: the only file that knows tasks live in PostgreSQL via Prisma. */
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filter: { status?: TaskStatus } = {}): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: filter.status ? { status: filter.status } : {},
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
    });
  }

  findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  create(data: NewTask): Promise<Task> {
    return this.prisma.task.create({ data });
  }

  update(id: string, changes: TaskChanges): Promise<Task> {
    return this.prisma.task.update({ where: { id }, data: changes });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }
}
