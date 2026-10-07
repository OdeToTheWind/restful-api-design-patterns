import { Router } from 'express';
import todoRoutes from './todo.routes';

const router = Router();
router.use('/todos', todoRoutes);

export default router;
