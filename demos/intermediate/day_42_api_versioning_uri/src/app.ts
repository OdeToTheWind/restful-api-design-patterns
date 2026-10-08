import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApiResponse, errorHandler, healthRouter, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import type { AppConfig } from './config';
import { v1Router } from './v1/v1.router';
import { v2Router } from './v2/v2.router';

/** URI versioning: the version is part of the path, so it's visible in logs, caches and links. */
export const createApp = (config: AppConfig, now: () => Date = () => new Date()): Application => {
  const app = express();
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, exposedHeaders: ['Deprecation', 'Sunset', 'Link'] }));
  app.use(express.json({ limit: '10kb' }));
  app.use(healthRouter());

  app.use('/api/v1', v1Router(config, now));
  app.use('/api/v2', v2Router());

  // Discovery: which versions exist and what state they are in
  app.get('/api/versions', (_req: Request, res: Response) => {
    const retired = now() >= config.v1.sunsetAt;
    ApiResponse.success(res, [
      {
        version: 'v1',
        status: retired ? 'retired' : 'deprecated',
        sunsetAt: config.v1.sunsetAt.toISOString(),
        docs: '/api/v1/docs',
      },
      { version: 'v2', status: 'current', sunsetAt: null, docs: '/api/v2/docs' },
    ]);
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 42 - API Versioning', versions: '/api/versions', day: 42 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
