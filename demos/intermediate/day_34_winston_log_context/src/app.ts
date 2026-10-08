import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  ApiResponse,
  asyncHandler,
  docsRouter,
  errorHandler,
  healthRouter,
  logger,
  notFoundHandler,
  requestId,
  requestLogger,
  validateBody,
  validateParams,
  validateQuery,
} from '@restful/shared';
import type { AppConfig } from './config';
import { openApiDocument } from './docs/openapi';
import { RecentLogsTransport } from './lib/recent-logs';
import { authenticate } from './middleware/auth.middleware';
import { OrderService } from './services/order.service';
import { debugLogsQuery, orderIdParamsSchema, placeOrderSchema } from './validators';

export const createApp = (
  config: AppConfig,
  orders = new OrderService(),
  recentLogs?: RecentLogsTransport,
): Application => {
  logger.level = config.logLevel;
  const app = express();
  const auth = authenticate(config.jwtSecret);

  app.use(requestId); // opens the per-request log context
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(healthRouter());
  app.use(docsRouter(openApiDocument));

  app.post(
    '/api/orders',
    auth,
    validateBody(placeOrderSchema),
    asyncHandler(async (req: Request, res: Response) => {
      ApiResponse.success(res, await orders.place(req.user!.id, req.body), 'Order placed', 201);
    }),
  );

  app.get('/api/orders/:id', auth, validateParams(orderIdParamsSchema), (req: Request, res: Response) => {
    ApiResponse.success(res, orders.get(req.user!.id, req.params.id), 'Order fetched');
  });

  // Development aid: what the logger actually wrote (context added, secrets redacted)
  if (config.exposeRecentLogs && recentLogs) {
    app.get('/api/debug/logs', validateQuery(debugLogsQuery), (req: Request, res: Response) => {
      ApiResponse.success(res, recentLogs.list({ requestId: req.query.requestId as string | undefined }));
    });
  }

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 34 - Log Context', documentation: '/api/docs', day: 34 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
