import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { docsRouter, errorHandler, healthRouter, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import apiRoutes from './routes';
import { config } from './config';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import prisma from './lib/prisma';
import { s3 } from './lib/storage';
import { openApiDocument } from './docs/openapi';

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
    database: () => prisma.$queryRaw`SELECT 1`,
    // Uploads are useless without the bucket, so storage is part of readiness
    storage: () => s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket })),
  }),
);

// API docs: /api/docs (Swagger UI) and /api/docs/openapi.json
app.use(docsRouter(openApiDocument));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 39 - File Upload to Cloud Storage',
    documentation: '/api/docs',
    day: 39,
  });
});

// Unknown routes → 404, then the global error handler — both must come AFTER every route
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
