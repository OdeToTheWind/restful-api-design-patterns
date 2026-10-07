import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler, requestId, requestLogger } from '@restful/shared';
import apiRoutes from './routes';
import { config } from './config';
import { openApiDocument } from './docs/openapi';

const app: Application = express();

// Request id + one log line per request — first, so every later log can reference it
app.use(requestId);
app.use(requestLogger);

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API docs: raw spec for tools/codegen, Swagger UI for humans
app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 29 - RBAC (Roles & Permissions)',
    documentation: '/api/docs',
    day: 29,
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
