import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  docsRouter,
  errorHandler,
  HealthCheck,
  healthRouter,
  notFoundHandler,
  requestId,
  requestLogger,
} from '@restful/shared';
import { config } from './config';
import { openApiDocument } from './docs/openapi';
import { createTaskRoutes } from './routes/task.routes';
import type { TaskService } from './services/task.service';

export interface AppDependencies {
  taskService: TaskService;
  readinessChecks?: Record<string, HealthCheck>;
}

/**
 * The app is built from its dependencies instead of importing them, so tests can pass a
 * service backed by the in-memory repository and production passes the Prisma one (index.ts).
 */
export const createApp = ({ taskService, readinessChecks = {} }: AppDependencies): Application => {
  const app = express();

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(healthRouter(readinessChecks));
  app.use(docsRouter(openApiDocument));
  app.use('/api/tasks', createTaskRoutes(taskService));

  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 37 - Repository and Service Layer', documentation: '/api/docs', day: 37 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
