import { AppError } from '@restful/shared';
import { canTransition, NewTask, Task, TaskStatus, ALLOWED_TRANSITIONS } from '../domain/task';
import type { TaskRepository } from '../repositories/task.repository';

/**
 * Business rules live here — not in controllers (HTTP) and not in repositories (storage).
 * Dependencies (repository, clock) are injected, so every rule is testable without a database.
 */
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(status?: TaskStatus): Promise<Task[]> {
    return this.tasks.list({ status });
  }

  async get(id: string): Promise<Task> {
    const task = await this.tasks.findById(id);
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async create(input: NewTask): Promise<Task> {
    this.assertDueDateNotInPast(input.dueDate);
    return this.tasks.create(input);
  }

  async edit(id: string, changes: Pick<NewTask, 'title' | 'description' | 'dueDate'>): Promise<Task> {
    const task = await this.get(id);
    if (task.status === 'DONE') throw new AppError('Completed tasks cannot be edited; reopen it first', 409);
    this.assertDueDateNotInPast(changes.dueDate);
    return this.tasks.update(id, changes);
  }

  /** Moves a task through the workflow and keeps `completedAt` consistent with the status. */
  async transition(id: string, to: TaskStatus): Promise<Task> {
    const task = await this.get(id);
    if (task.status === to) return task; // idempotent: repeating a transition is a no-op
    if (!canTransition(task.status, to)) {
      throw new AppError(`Cannot move a task from ${task.status} to ${to}`, 409, {
        status: [`allowed from ${task.status}: ${ALLOWED_TRANSITIONS[task.status].join(', ')}`],
      });
    }
    return this.tasks.update(id, { status: to, completedAt: to === 'DONE' ? this.now() : null });
  }

  /** Completed tasks are kept as history. */
  async remove(id: string): Promise<void> {
    const task = await this.get(id);
    if (task.status === 'DONE') throw new AppError('Completed tasks cannot be deleted', 409);
    await this.tasks.delete(id);
  }

  private assertDueDateNotInPast(dueDate: Date | null | undefined) {
    if (dueDate && dueDate.getTime() < this.now().getTime()) {
      throw new AppError('Validation failed', 400, { dueDate: ['must not be in the past'] });
    }
  }
}
