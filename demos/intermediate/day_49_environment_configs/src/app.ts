import { timingSafeEqual } from 'node:crypto';
import express, { Application, Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  ApiResponse,
  AppError,
  docsRouter,
  errorHandler,
  healthRouter,
  logger,
  notFoundHandler,
  requestId,
  requestLogger,
} from '@restful/shared';
import { AppConfig, redactConfig } from './config';
import { openApiDocument } from './docs/openapi';

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Everything configurable comes in through `config` — nothing below reads process.env. */
export const createApp = (config: AppConfig): Application => {
  logger.level = config.logLevel;
  const app = express();

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(healthRouter());
  app.use(docsRouter(openApiDocument));

  // Behaviour driven by configuration: the limit differs per environment
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: config.rateLimitPerMinute,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) => {
        ApiResponse.error(res, 'Too many requests', 429);
      },
    }),
  );

  app.get('/api/info', (_req: Request, res: Response) => {
    ApiResponse.success(res, {
      environment: config.environment,
      features: config.features,
      rateLimitPerMinute: config.rateLimitPerMinute,
    });
  });

  // A feature flag: new behaviour can ship switched off and be enabled per environment
  app.get('/api/greeting', (_req: Request, res: Response) => {
    const message = config.features.newGreeting
      ? `👋 Welcome! This greeting is enabled by FEATURE_NEW_GREETING in ${config.environment}.`
      : 'Hello from Day 49!';
    ApiResponse.success(res, { message });
  });

  const requireAdminKey: RequestHandler = (req, _res, next) => {
    if (!config.adminApiKey) return next(new AppError('Admin API is disabled (ADMIN_API_KEY not set)', 404));
    const presented = req.get('X-Admin-Key');
    if (!presented || !safeEqual(presented, config.adminApiKey)) return next(new AppError('Invalid admin key', 401));
    next();
  };

  // Operators can see the effective configuration — with secrets redacted
  app.get('/api/admin/config', requireAdminKey, (_req: Request, res: Response) => {
    ApiResponse.success(res, redactConfig(config));
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 49 - Environment Configs', documentation: '/api/docs', day: 49 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
