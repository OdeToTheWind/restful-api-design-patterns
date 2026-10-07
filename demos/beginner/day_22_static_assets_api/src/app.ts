import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app: Application = express();

// Serve static files
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 22 - Static Assets API',
    documentation: '/api/assets',
    day: 22,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
