import { Router } from 'express';
import { TestController } from '../controllers/test.controller';

const router = Router();

router.get('/success', TestController.success);
router.get('/bad-request', TestController.badRequest);
router.get('/not-found', TestController.notFound);
router.get('/server-error', TestController.serverError);

export default router;
