import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 3 - Todo CRUD In-Memory',
    documentation: '/api/todos',
    day: 3,
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
