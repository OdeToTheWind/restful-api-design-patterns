import type { PrismaClient } from '../../generated/prisma';
import { PrismaTaskRepository } from '../repositories/prisma-task.repository';

// The adapter is thin; these tests pin down how domain calls map to Prisma queries
const prisma = {
  task: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};
const repo = new PrismaTaskRepository(prisma as unknown as PrismaClient);

beforeEach(() => jest.clearAllMocks());

it('lists with an optional status filter, soonest due first (nulls last)', async () => {
  prisma.task.findMany.mockResolvedValue([]);
  await repo.list({ status: 'DONE' });
  await repo.list();

  const orderBy = [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }];
  expect(prisma.task.findMany).toHaveBeenNthCalledWith(1, { where: { status: 'DONE' }, orderBy });
  expect(prisma.task.findMany).toHaveBeenNthCalledWith(2, { where: {}, orderBy });
});

it('maps find, create, update and delete one-to-one', async () => {
  await repo.findById('t1');
  await repo.create({ title: 'A' });
  await repo.update('t1', { status: 'IN_PROGRESS' });
  await repo.delete('t1');

  expect(prisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 't1' } });
  expect(prisma.task.create).toHaveBeenCalledWith({ data: { title: 'A' } });
  expect(prisma.task.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'IN_PROGRESS' } });
  expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
});
