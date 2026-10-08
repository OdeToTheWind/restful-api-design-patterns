import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { docsRouter, errorHandler, healthRouter, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import apiRoutes from './routes';
import { config } from './config';
import prisma from './lib/prisma';
import { openApiDocument } from './docs/openapi';

export const createApp = (appConfig = config): Application => {
  const app: Application = express();

  // Trust reverse proxy (Caddy/Traefik) so req.protocol, req.secure, and req.ip reflect real client
  if (appConfig.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Request id + one log line per request — first, so every later log can reference it
  app.use(requestId);
  app.use(requestLogger);

  app.use(helmet());
  app.use(cors({ origin: appConfig.corsOrigins }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Liveness (/health) and readiness (/ready) probes for Docker, load balancers, uptime checks
  app.use(healthRouter({ database: () => prisma.$queryRaw`SELECT 1` }));

  // API docs: /api/docs (Swagger UI) and /api/docs/openapi.json
  app.use(docsRouter(openApiDocument));

  app.use('/api', apiRoutes);

  // Reverse proxy verification endpoint (debug endpoint: non-production only)
  if (appConfig.nodeEnv !== 'production') {
    app.get('/api/proxy-info', (req: Request, res: Response) => {
      res.json({
        protocol: req.protocol,
        secure: req.secure,
        ip: req.ip,
        ips: req.ips,
        host: req.get('host'),
        forwardedProto: req.get('x-forwarded-proto') || null,
      });
    });
  }

  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Welcome to Day 46 - Docker Containerization',
      documentation: '/api/docs',
      runInDocker: 'pnpm docker:up',
      protocol: req.protocol,
      secure: req.secure,
      ip: req.ip,
      day: 46,
    });
  });

  // Unknown routes → 404, then the global error handler — both must come AFTER every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();
export default app;
