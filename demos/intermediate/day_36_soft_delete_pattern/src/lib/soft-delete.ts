/** Pure helpers used by the Prisma extension — easy to unit-test without a database. */

export const ACTIVE = { deletedAt: null } as const;

/** Adds `deletedAt: null` to a query's `where` (an explicit deletedAt condition from the caller wins). */
export const onlyActive = <T extends { where?: object }>(args: T): T => ({
  ...args,
  where: { ...ACTIVE, ...(args.where ?? {}) },
});
