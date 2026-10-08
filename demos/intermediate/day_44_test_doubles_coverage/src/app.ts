import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  ApiResponse,
  asyncHandler,
  docsRouter,
  errorHandler,
  healthRouter,
  notFoundHandler,
  requestId,
  requestLogger,
  validateBody,
  validateParams,
} from '@restful/shared';
import { config } from './config';
import { openApiDocument } from './docs/openapi';
import type { CheckoutService } from './checkout/checkout.service';
import { checkoutSchema, orderIdParamsSchema } from './checkout/schemas';

export const createApp = (checkout: CheckoutService): Application => {
  const app = express();
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(healthRouter());
  app.use(docsRouter(openApiDocument));

  app.post(
    '/api/checkout',
    validateBody(checkoutSchema),
    asyncHandler(async (req: Request, res: Response) => {
      ApiResponse.success(res, await checkout.checkout(req.body), 'Order placed', 201);
    }),
  );
  app.get(
    '/api/orders/:id',
    validateParams(orderIdParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      ApiResponse.success(res, await checkout.get(req.params.id), 'Order fetched');
    }),
  );

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Day 44 - Test Doubles and Coverage', documentation: '/api/docs', day: 44 });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
