import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, healthRouter, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import apiRoutes from './routes';
import { config } from './config';
import prisma from './lib/prisma';

const app: Application = express();

// Request id + one log line per request — first, so every later log can reference it
app.use(requestId);
app.use(requestLogger);

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Liveness (/health) and readiness (/ready) probes for Docker, load balancers, uptime checks
app.use(healthRouter({ database: () => prisma.$queryRaw`SELECT 1` }));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 28 - JWT Authentication',
    documentation: '/api/auth/register',
    day: 28,
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
