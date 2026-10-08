import { PrismaClient } from '../../generated/prisma';
import { onlyActive } from './soft-delete';

// Single PrismaClient per process — every module imports this instance
// instead of calling `new PrismaClient()` (each one opens its own connection pool).
const base = new PrismaClient();

/**
 * Soft delete in ONE place: with this extension, ordinary Prisma calls behave correctly
 * everywhere in the app — reads never see deleted rows and `delete` only sets `deletedAt`.
 * Nobody has to remember to add `deletedAt: null` to each query.
 */
const prisma = base.$extends({
  name: 'soft-delete',
  query: {
    article: {
      findMany: ({ args, query }) => query(onlyActive(args)),
      findFirst: ({ args, query }) => query(onlyActive(args)),
      findFirstOrThrow: ({ args, query }) => query(onlyActive(args)),
      findUnique: ({ args, query }) => query(onlyActive(args)),
      findUniqueOrThrow: ({ args, query }) => query(onlyActive(args)),
      count: ({ args, query }) => query(onlyActive(args)),
      update: ({ args, query }) => query(onlyActive(args)),
      // DELETE becomes "move to trash"
      delete: ({ args }) => base.article.update({ where: onlyActive(args).where, data: { deletedAt: new Date() } }),
      deleteMany: ({ args }) =>
        base.article.updateMany({ where: onlyActive(args).where, data: { deletedAt: new Date() } }),
    },
  },
});

/**
 * The unfiltered client — the explicit escape hatch for the trash: listing deleted rows,
 * restoring them and purging them for good. Only the trash controller imports it.
 */
export const prismaWithDeleted = base;

export default prisma;
