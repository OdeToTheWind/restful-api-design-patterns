import createClient from 'openapi-fetch';
import type { paths } from './schema';

/**
 * A fully typed client generated from the contract: paths, params, request bodies and
 * response shapes are checked by the compiler, e.g.
 *
 *   const books = createBooksClient('http://localhost:3031');
 *   const { data, error } = await books.POST('/api/books', { body: { title, author, isbn } });
 */
export const createBooksClient = (baseUrl: string) => createClient<paths>({ baseUrl });
