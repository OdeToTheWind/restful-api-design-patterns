import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

router.get('/', OrderController.getAllOrders);
router.put('/:id', OrderController.createOrUpdateOrder);   // Idempotent
router.delete('/:id', OrderController.deleteOrder);        // Idempotent

export default router;