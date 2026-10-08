import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestHandler } from 'express';

/**
 * Counts database round trips per request, to make the N+1 problem visible:
 * every Prisma operation increments the counter of the request that issued it, and the
 * total is returned in the X-Prisma-Operations response header.
 */
const storage = new AsyncLocalStorage<{ operations: number }>();

export const countOperation = (): void => {
  const store = storage.getStore();
  if (store) store.operations += 1;
};

export const operationCounter: RequestHandler = (_req, res, next) => {
  const store = { operations: 0 };
  // Set the header just before the body is sent
  const json = res.json.bind(res);
  res.json = (body: unknown) => {
    res.setHeader('X-Prisma-Operations', String(store.operations));
    return json(body);
  };
  storage.run(store, next);
};
