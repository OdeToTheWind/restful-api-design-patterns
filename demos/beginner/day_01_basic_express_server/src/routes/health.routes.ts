import { Request, Response, Router } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;