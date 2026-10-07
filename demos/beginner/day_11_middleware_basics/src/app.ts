import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes';
import { requestLogger } from './middleware/logger.middleware';

dotenv.config();

const app: Application = express();

// === Middleware Stack ===
app.use(cors());                    // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);             // Custom logging middleware

app.use('/api', apiRoutes);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 11 - Middleware Basics',
    documentation: '/api/users',
    day: 11,
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
