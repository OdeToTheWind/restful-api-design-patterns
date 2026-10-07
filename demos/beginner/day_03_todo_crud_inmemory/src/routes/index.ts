import { Router } from 'express';
import todoRoutes from './todo.routes';

const router = Router();

// Mount todo routes under /todos
router.use('/todos', todoRoutes);

export default router;