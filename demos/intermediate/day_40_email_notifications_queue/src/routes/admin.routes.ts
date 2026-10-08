import { Router } from 'express';
import { asyncHandler, validateParams } from '@restful/shared';
import { AdminController } from '../controllers/admin.controller';
import { requireAdminKey } from '../middleware/admin.middleware';
import { jobIdParamsSchema } from '../emails/schema';
import type { EmailQueue } from '../queue/email.queue';

export const createAdminRouter = (queue: EmailQueue): Router => {
  const router = Router();
  const controller = new AdminController(queue);

  router.use(requireAdminKey);

  router.get('/emails/failed', asyncHandler(controller.listFailed));
  router.post('/emails/failed/:jobId/retry', validateParams(jobIdParamsSchema), asyncHandler(controller.retryJob));

  return router;
};
