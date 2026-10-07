import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

// Global Error Handler (Must be last)
app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 10 - Error Handling Introduction',
    documentation: '/api/users',
    day: 10,
  });
});

export default app;
