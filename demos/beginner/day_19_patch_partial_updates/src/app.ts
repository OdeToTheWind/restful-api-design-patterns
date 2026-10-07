import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 19 - PATCH Partial Updates',
    documentation: '/api/profiles/1',
    day: 19,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
