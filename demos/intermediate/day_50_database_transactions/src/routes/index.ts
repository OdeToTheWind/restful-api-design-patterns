import { Request, Response, Router } from 'express';
import { ApiResponse, AppError, asyncHandler, validateBody, validateParams, validateQuery } from '@restful/shared';
import prisma from '../lib/prisma';
import { RETRY_AFTER_SECONDS, transfer } from '../services/transfer.service';
import {
  createAccountSchema,
  idempotencyKey,
  idParamsSchema,
  transferSchema,
  transfersQuery,
  updateAccountSchema,
} from '../validators/schemas';

const etag = (version: number) => `"${version}"`;

/** If-Match: "3" → 3. Weak validators (W/"3") are not accepted for writes. */
const parseIfMatch = (header: string | undefined): number | undefined => {
  const match = header?.match(/^"(\d+)"$/);
  return match ? Number(match[1]) : undefined;
};

const router = Router();
const validId = validateParams(idParamsSchema);

router.post(
  '/accounts',
  validateBody(createAccountSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const account = await prisma.account.create({
      data: { owner: req.body.owner, balanceCents: req.body.initialBalanceCents },
    });
    res.setHeader('ETag', etag(account.version));
    ApiResponse.success(res, account, 'Account created', 201);
  }),
);

router.get(
  '/accounts/:id',
  validId,
  asyncHandler(async (req: Request, res: Response) => {
    const account = await prisma.account.findUniqueOrThrow({ where: { id: req.params.id } });
    res.setHeader('ETag', etag(account.version));
    if (req.get('If-None-Match') === etag(account.version)) return res.status(304).end();
    ApiResponse.success(res, account, 'Account fetched');
  }),
);

/**
 * Optimistic locking: the client must send the ETag it last saw. If someone changed the
 * account since (version moved on), the update matches nothing and the client gets 412
 * instead of silently overwriting the other change ("lost update").
 */
router.patch(
  '/accounts/:id',
  validId,
  validateBody(updateAccountSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const expected = parseIfMatch(req.get('If-Match'));
    if (expected === undefined) throw new AppError('If-Match header with the current ETag is required', 428);

    const { count } = await prisma.account.updateMany({
      where: { id: req.params.id, version: expected },
      data: { owner: req.body.owner, version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await prisma.account.findUnique({ where: { id: req.params.id }, select: { version: true } });
      if (!current) throw new AppError('Account not found', 404);
      res.setHeader('ETag', etag(current.version));
      throw new AppError('The account was changed by someone else; reload it and try again', 412);
    }

    const account = await prisma.account.findUniqueOrThrow({ where: { id: req.params.id } });
    res.setHeader('ETag', etag(account.version));
    ApiResponse.success(res, account, 'Account updated');
  }),
);

router.post(
  '/transfers',
  validateBody(transferSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const key = req.get('Idempotency-Key');
    if (key !== undefined && !idempotencyKey.safeParse(key).success) {
      throw new AppError('Validation failed', 400, {
        'Idempotency-Key': ['8–100 characters: letters, digits, _ or -'],
      });
    }
    const result = await transfer({ ...req.body, idempotencyKey: key }).catch((error: unknown) => {
      if (error instanceof AppError && error.statusCode === 503)
        res.setHeader('Retry-After', String(RETRY_AFTER_SECONDS));
      throw error;
    });
    if (result.replayed) res.setHeader('Idempotent-Replayed', 'true');
    ApiResponse.success(
      res,
      result.transfer,
      result.replayed ? 'Transfer already done' : 'Transfer completed',
      result.replayed ? 200 : 201,
    );
  }),
);

router.get(
  '/transfers',
  validateQuery(transfersQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.query.accountId as string | undefined;
    const transfers = await prisma.transfer.findMany({
      where: accountId ? { OR: [{ fromId: accountId }, { toId: accountId }] } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    ApiResponse.success(res, transfers, 'Transfers fetched');
  }),
);

export default router;
