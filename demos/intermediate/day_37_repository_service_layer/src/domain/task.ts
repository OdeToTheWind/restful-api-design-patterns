/**
 * Domain model — plain types with no Express or Prisma imports. Services and repositories
 * speak this language; only the Prisma repository knows how it maps to database rows.
 */
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTask {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
}

export type TaskChanges = Partial<Pick<Task, 'title' | 'description' | 'dueDate' | 'status' | 'completedAt'>>;

/** The workflow: a task must be started before it can be done, and a done task can be reopened. */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: ['IN_PROGRESS'],
};

export const canTransition = (from: TaskStatus, to: TaskStatus): boolean => ALLOWED_TRANSITIONS[from].includes(to);
