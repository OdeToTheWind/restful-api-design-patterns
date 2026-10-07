import { Router } from 'express';
import profileRoutes from './profile.routes';

const router = Router();
router.use('/profiles', profileRoutes);

export default router;