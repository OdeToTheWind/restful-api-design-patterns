import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.middleware';
import apiRoutes from './routes';
import { config } from './config';

const app: Application = express();

// Security & CORS
app.use(helmet());
app.use(corsMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes with versioning
app.use(`/api/${config.apiVersion}`, apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    environment: config.nodeEnv,
    version: config.apiVersion,
    uptime: process.uptime()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 12 - CORS & Environment Setup',
    documentation: `/api/${config.apiVersion}/products`,
    day: 12,
  });
});

export default app;
