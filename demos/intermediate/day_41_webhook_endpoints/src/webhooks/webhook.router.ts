import express, { Request, Response, Router } from 'express';
import { ApiResponse, AppError, asyncHandler, logger } from '@restful/shared';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';
import { config } from '../config';
import { SIGNATURE_HEADER, verifySignature } from './signature';
import { anyEventSchema, paymentEventSchema } from './events';

const isDuplicate = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Mounted BEFORE express.json(): the signature is computed over the exact bytes received,
 * so the body must be read raw — re-serialising parsed JSON would change it.
 */
export const webhookRouter = (): Router => {
  const router = Router();

  router.post(
    '/payments',
    express.raw({ type: 'application/json', limit: '100kb' }),
    asyncHandler(async (req: Request, res: Response) => {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const verified = verifySignature(req.get(SIGNATURE_HEADER), rawBody, config.webhookSecret, {
        toleranceSeconds: config.webhookToleranceSeconds,
      });
      if (!verified.ok) {
        logger.warn('webhook rejected', { reason: verified.reason });
        throw new AppError('Invalid webhook signature', 401);
      }

      let body: unknown;
      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new AppError('Webhook body is not valid JSON', 400);
      }
      const envelope = anyEventSchema.safeParse(body);
      if (!envelope.success) throw new AppError('Validation failed', 400, envelope.error.flatten().fieldErrors);

      const event = paymentEventSchema.safeParse(body);
      if (!event.success) {
        logger.info('webhook ignored', { eventId: envelope.data.id, type: envelope.data.type });
        return ApiResponse.success(res, { eventId: envelope.data.id, status: 'ignored' }, 'Event type not handled');
      }

      const { id: eventId, type, data } = event.data;
      try {
        // Record the event and apply it atomically: either both happen or neither does
        await prisma.$transaction(async (tx) => {
          await tx.webhookEvent.create({ data: { eventId, type, payload: event.data } });
          // Only PENDING orders move: a late or out-of-order event can't undo a final state
          await tx.order.updateMany({
            where: { id: data.orderId, status: 'PENDING' },
            data: { status: type === 'payment.succeeded' ? 'PAID' : 'FAILED' },
          });
        });
      } catch (error) {
        if (!isDuplicate(error)) throw error;
        logger.info('duplicate webhook delivery', { eventId });
        return ApiResponse.success(res, { eventId, status: 'duplicate' }, 'Event already processed');
      }

      logger.info('webhook processed', { eventId, type, orderId: data.orderId });
      ApiResponse.success(res, { eventId, status: 'processed' }, 'Event processed');
    }),
  );

  return router;
};
