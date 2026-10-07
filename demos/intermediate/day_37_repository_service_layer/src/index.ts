import { startServer } from '@restful/shared';
import { createApp } from './app';
import { config } from './config';
import prisma from './lib/prisma';
import { PrismaTaskRepository } from './repositories/prisma-task.repository';
import { TaskService } from './services/task.service';

// Composition root: the one place where concrete implementations are chosen and wired together
const taskService = new TaskService(new PrismaTaskRepository(prisma));
const app = createApp({ taskService, readinessChecks: { database: () => prisma.$queryRaw`SELECT 1` } });

startServer(app, { port: config.port, name: 'Day 37', onShutdown: [() => prisma.$disconnect()] });
