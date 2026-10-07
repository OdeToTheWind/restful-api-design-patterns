import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { requestLogger } from './middleware/logger.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(requestLogger);

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 14 - Logging Setup with Winston',
    documentation: '/api/users',
    day: 14,
  });
});

export default app;
