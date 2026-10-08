import { Router } from 'express';
import { z } from 'zod';
import { ApiResponse, asyncHandler, validateBody, validateParams } from '@restful/shared';
import prisma from '../lib/prisma';

export const createOrderSchema = z.object({ amountCents: z.number().int().min(1) });
export const orderIdParamsSchema = z.object({ id: z.string().cuid() });

const router = Router();

// Orders are created PENDING; only a verified webhook from the payment provider moves them on
router.post(
  '/orders',
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    ApiResponse.success(res, await prisma.order.create({ data: req.body }), 'Order created', 201);
  }),
);

router.get(
  '/orders/:id',
  validateParams(orderIdParamsSchema),
  asyncHandler(async (req, res) => {
    ApiResponse.success(res, await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } }), 'Order fetched');
  }),
);

router.get(
  '/webhooks/events',
  asyncHandler(async (_req, res) => {
    const events = await prisma.webhookEvent.findMany({ orderBy: { receivedAt: 'desc' }, take: 50 });
    ApiResponse.success(res, events, 'Recent webhook events');
  }),
);

export default router;
