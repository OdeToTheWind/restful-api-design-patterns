import { AppError, logger } from '@restful/shared';
import { Prisma } from '../../generated/prisma';
import prisma from '../lib/prisma';

export interface TransferInput {
  fromId: string;
  toId: string;
  amountCents: number;
  idempotencyKey?: string;
}

// Serializable transactions on a hot row conflict a lot; retry with growing, jittered pauses
export const MAX_ATTEMPTS = 8;
export const RETRY_AFTER_SECONDS = 1;
const isKnown = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Moves money atomically: the debit, the credit and the transfer record all commit or all
 * roll back. Runs at SERIALIZABLE isolation; when Postgres aborts a transaction because of a
 * concurrent conflict (P2034), the whole transaction is retried with a short random backoff.
 */
export const transfer = async (
  input: TransferInput,
): Promise<{ transfer: Prisma.TransferGetPayload<object>; replayed: boolean }> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction((tx) => runTransfer(tx, input), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isKnown(error, 'P2034')) {
        if (attempt < MAX_ATTEMPTS) {
          logger.warn('transfer conflicted with a concurrent one, retrying', { attempt });
          // Exponential backoff with full jitter: spreads retries out so they stop colliding
          await pause(Math.random() * Math.min(500, 10 * 2 ** attempt));
          continue;
        }
        // Still conflicting: nothing went wrong with the request itself, so say "try again"
        // (503 + Retry-After) rather than 500, which would look like a bug
        throw new AppError('The account is busy; please retry', 503);
      }
      // Two requests with the same new key raced: the loser returns the winner's transfer
      if (isKnown(error, 'P2002') && input.idempotencyKey) {
        const existing = await prisma.transfer.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) return { transfer: existing, replayed: true };
      }
      throw error;
    }
  }
};

const runTransfer = async (
  tx: Prisma.TransactionClient,
  { fromId, toId, amountCents, idempotencyKey }: TransferInput,
) => {
  if (idempotencyKey) {
    const existing = await tx.transfer.findUnique({ where: { idempotencyKey } });
    if (existing) {
      // Same key, different request: refuse rather than silently returning something else
      if (existing.fromId !== fromId || existing.toId !== toId || existing.amountCents !== amountCents) {
        throw new AppError('Idempotency-Key was already used for a different transfer', 422);
      }
      return { transfer: existing, replayed: true };
    }
  }

  // Conditional debit: only succeeds if the balance covers it — no read-then-write race
  const debit = await tx.account.updateMany({
    where: { id: fromId, balanceCents: { gte: amountCents } },
    data: { balanceCents: { decrement: amountCents }, version: { increment: 1 } },
  });
  if (debit.count === 0) {
    const exists = await tx.account.findUnique({ where: { id: fromId }, select: { id: true } });
    throw exists ? new AppError('Insufficient funds', 409) : new AppError('Source account not found', 404);
  }

  // A missing destination throws P2025 → the debit above is rolled back with it
  await tx.account.update({
    where: { id: toId },
    data: { balanceCents: { increment: amountCents }, version: { increment: 1 } },
  });

  const transfer = await tx.transfer.create({ data: { fromId, toId, amountCents, idempotencyKey } });
  return { transfer, replayed: false };
};
