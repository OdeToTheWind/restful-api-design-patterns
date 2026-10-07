import { AppError } from '@restful/shared';
import { InMemoryTaskRepository } from '../repositories/in-memory-task.repository';
import { TaskService } from '../services/task.service';

// No mocks: a real repository (in memory) and a controllable clock
let clock: Date;
const now = () => clock;
let service: TaskService;

beforeEach(() => {
  clock = new Date('2026-10-08T10:00:00Z');
  service = new TaskService(new InMemoryTaskRepository(now), now);
});

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: AppError) => error,
  );

describe('create', () => {
  it('starts every task as TODO', async () => {
    const task = await service.create({ title: 'Write tests' });
    expect(task).toMatchObject({ title: 'Write tests', status: 'TODO', completedAt: null });
  });

  it('rejects a due date in the past', async () => {
    const error = await rejection(service.create({ title: 'Late', dueDate: new Date('2026-10-07T00:00:00Z') }));
    expect(error).toMatchObject({ statusCode: 400, errors: { dueDate: ['must not be in the past'] } });
  });
});

describe('transition (workflow rules)', () => {
  it('TODO → IN_PROGRESS → DONE sets completedAt; reopening clears it', async () => {
    const { id } = await service.create({ title: 'Ship' });

    await service.transition(id, 'IN_PROGRESS');
    clock = new Date('2026-10-09T12:00:00Z');
    const done = await service.transition(id, 'DONE');
    expect(done).toMatchObject({ status: 'DONE', completedAt: new Date('2026-10-09T12:00:00Z') });

    const reopened = await service.transition(id, 'IN_PROGRESS');
    expect(reopened).toMatchObject({ status: 'IN_PROGRESS', completedAt: null });
  });

  it('refuses to skip straight from TODO to DONE', async () => {
    const { id } = await service.create({ title: 'Ship' });
    const error = await rejection(service.transition(id, 'DONE'));
    expect(error).toMatchObject({ statusCode: 409, message: 'Cannot move a task from TODO to DONE' });
  });

  it('is idempotent when the task already has the target status', async () => {
    const { id, updatedAt } = await service.create({ title: 'Ship' });
    clock = new Date('2026-10-10T00:00:00Z');
    expect((await service.transition(id, 'TODO')).updatedAt).toEqual(updatedAt);
  });
});

describe('edit and remove', () => {
  it('edits open tasks but not completed ones', async () => {
    const { id } = await service.create({ title: 'Draft' });
    expect((await service.edit(id, { title: 'Final' })).title).toBe('Final');

    await service.transition(id, 'IN_PROGRESS');
    await service.transition(id, 'DONE');
    expect(await rejection(service.edit(id, { title: 'Too late' }))).toMatchObject({ statusCode: 409 });
  });

  it('deletes open tasks and keeps completed ones as history', async () => {
    const open = await service.create({ title: 'Temp' });
    await service.remove(open.id);
    expect(await rejection(service.get(open.id))).toMatchObject({ statusCode: 404 });

    const done = await service.create({ title: 'Done' });
    await service.transition(done.id, 'IN_PROGRESS');
    await service.transition(done.id, 'DONE');
    expect(await rejection(service.remove(done.id))).toMatchObject({ statusCode: 409 });
  });
});

describe('list', () => {
  it('filters by status and orders by due date (undated last), then newest', async () => {
    const later = await service.create({ title: 'Later', dueDate: new Date('2026-12-01T00:00:00Z') });
    const undated = await service.create({ title: 'Someday' });
    const soon = await service.create({ title: 'Soon', dueDate: new Date('2026-10-20T00:00:00Z') });
    await service.transition(later.id, 'IN_PROGRESS');

    expect((await service.list()).map((t) => t.id)).toEqual([soon.id, later.id, undated.id]);
    expect((await service.list('IN_PROGRESS')).map((t) => t.id)).toEqual([later.id]);
  });
});
