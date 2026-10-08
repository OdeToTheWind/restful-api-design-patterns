import { cursorPaginationQuery, offsetPaginationQuery } from '@restful/shared';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().toLowerCase().min(1).max(40),
  priceCents: z.number().int().min(0).max(100_000_000),
  stock: z.number().int().min(0).default(0),
});

// Sort is a whitelist: "price" ascending, "-price" descending. Arbitrary column names are rejected.
export const SORT_FIELDS = { name: 'name', price: 'priceCents', createdAt: 'createdAt' } as const;
const sortValues = Object.keys(SORT_FIELDS).flatMap((field) => [field, `-${field}`]) as [string, ...string[]];

const filters = {
  category: z.string().trim().toLowerCase().min(1).max(40).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
};

const priceRangeIsValid = (query: { minPrice?: number; maxPrice?: number }) =>
  query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice;

export const listProductsQuery = offsetPaginationQuery
  .extend({ ...filters, sort: z.enum(sortValues).default('-createdAt') })
  .refine(priceRangeIsValid, { message: 'minPrice must not exceed maxPrice', path: ['minPrice'] });

export const productFeedQuery = cursorPaginationQuery.extend({ category: filters.category }).strict(); // unknown params like ?page= are a mistake on the feed — say so instead of ignoring them

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type ProductFeedQuery = z.infer<typeof productFeedQuery>;
