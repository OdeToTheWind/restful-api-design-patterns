import { Router } from 'express';
import uploadRoutes from './upload.routes';

const router = Router();
router.use('/uploads', uploadRoutes);

export default router;
