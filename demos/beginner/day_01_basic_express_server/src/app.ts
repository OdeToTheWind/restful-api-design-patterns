import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 1 - Basic Express REST API',
    documentation: '/api/health',
    day: 1,
    topic: 'Basic Express Server Setup',
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.path} does not exist`,
  });
});

export default app;