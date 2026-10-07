import express, { Application, Request, Response } from 'express';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import apiRoutes from './routes';

const app: Application = express();

app.use(express.json());
app.use(apiLimiter);   // Apply rate limiting globally

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 24 - Simple Rate Limiting',
    documentation: '/api/test/ping',
    day: 24,
  });
});

export default app;
