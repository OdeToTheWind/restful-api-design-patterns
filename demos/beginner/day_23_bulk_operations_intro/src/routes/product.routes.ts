import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.getAll);
router.post('/bulk', ProductController.bulkCreate);
router.delete('/bulk', ProductController.bulkDelete);

export default router;