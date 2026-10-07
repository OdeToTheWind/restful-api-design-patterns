import type { NewTask, Task, TaskChanges, TaskStatus } from '../domain/task';

/**
 * The persistence port. The service depends on this interface, never on Prisma, so the
 * storage can be swapped (Prisma in production, in-memory in tests) without touching rules.
 */
export interface TaskRepository {
  list(filter?: { status?: TaskStatus }): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(data: NewTask): Promise<Task>;
  update(id: string, changes: TaskChanges): Promise<Task>;
  delete(id: string): Promise<void>;
}
