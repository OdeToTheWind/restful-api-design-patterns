import { z } from 'zod';
import { AppError } from './errors';

/** `?page=2&pageSize=20` — validate with `validateQuery(offsetPaginationQuery)`. */
export const offsetPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** `?cursor=…&limit=20` — the cursor is opaque to clients (taken from the previous page's `nextCursor`). */
export const cursorPaginationQuery = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type OffsetPaginationQuery = z.infer<typeof offsetPaginationQuery>;
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuery>;

export interface OffsetPage<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPage<T> {
  items: T[];
  meta: { limit: number; nextCursor: string | null; hasNextPage: boolean };
}

/**
 * Offset pagination: simple and supports "jump to page N", but deep pages get slower
 * and rows can shift between requests when data changes.
 */
export const paginateOffset = async <T>(
  { page, pageSize }: OffsetPaginationQuery,
  fetchPage: (args: { skip: number; take: number }) => Promise<[T[], number]>,
): Promise<OffsetPage<T>> => {
  const [items, totalItems] = await fetchPage({ skip: (page - 1) * pageSize, take: pageSize });
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    items,
    meta: { page, pageSize, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  };
};

export const encodeCursor = (value: string): string => Buffer.from(value, 'utf8').toString('base64url');

export const decodeCursor = (cursor: string): string => {
  const value = Buffer.from(cursor, 'base64url').toString('utf8');
  // Round-trip check rejects anything that wasn't produced by encodeCursor
  if (!value || encodeCursor(value) !== cursor) {
    throw new AppError('Invalid cursor', 400);
  }
  return value;
};

/**
 * Cursor (keyset) pagination: stable under inserts/deletes and fast at any depth,
 * but only supports next-page navigation. Fetches one extra row to know if more exist.
 */
export const paginateCursor = async <T>(
  { cursor, limit }: CursorPaginationQuery,
  fetchPage: (args: { after?: string; take: number }) => Promise<T[]>,
  cursorOf: (item: T) => string,
): Promise<CursorPage<T>> => {
  const rows = await fetchPage({ after: cursor ? decodeCursor(cursor) : undefined, take: limit + 1 });
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return {
    items,
    meta: { limit, nextCursor: hasNextPage && last ? encodeCursor(cursorOf(last)) : null, hasNextPage },
  };
};
