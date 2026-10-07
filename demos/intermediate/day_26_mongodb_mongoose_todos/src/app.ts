import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, healthRouter, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import apiRoutes from './routes';
import { config } from './config';
import mongoose from 'mongoose';

const app: Application = express();

// Request id + one log line per request — first, so every later log can reference it
app.use(requestId);
app.use(requestLogger);

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Liveness (/health) and readiness (/ready) probes for Docker, load balancers, uptime checks
app.use(
  healthRouter({
    database: async () => {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error('not connected');
      await mongoose.connection.db.admin().ping();
    },
  }),
);

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 26 - MongoDB + Mongoose Todos',
    documentation: '/api/todos',
    day: 26,
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
