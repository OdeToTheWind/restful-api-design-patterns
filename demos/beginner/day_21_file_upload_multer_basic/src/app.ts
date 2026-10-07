import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Day 21 - File Upload Basics (Multer)',
    documentation: '/api/uploads/single',
    day: 21,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
