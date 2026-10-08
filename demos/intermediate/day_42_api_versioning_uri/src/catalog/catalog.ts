/**
 * One domain model and one data source, shared by every API version. Versions differ only
 * in how they present the data (their mappers) — the business logic is never forked.
 */
export interface Product {
  id: string;
  name: string;
  priceCents: number;
  currency: 'USD' | 'EUR';
  tags: string[];
}

const PRODUCTS: Product[] = [
  { id: 'p-1', name: 'RESTful Web APIs (book)', priceCents: 3999, currency: 'USD', tags: ['books', 'rest'] },
  { id: 'p-2', name: 'HTTP status code mug', priceCents: 1299, currency: 'USD', tags: ['merch'] },
  { id: 'p-3', name: 'Designing Data-Intensive Applications', priceCents: 5499, currency: 'USD', tags: ['books'] },
  { id: 'p-4', name: 'API style guide poster', priceCents: 1999, currency: 'EUR', tags: ['merch', 'design'] },
  { id: 'p-5', name: 'OpenAPI pocket reference', priceCents: 1499, currency: 'EUR', tags: ['books', 'openapi'] },
];

export const catalog = {
  all: (): Product[] => PRODUCTS,
  byId: (id: string): Product | undefined => PRODUCTS.find((product) => product.id === id),
};
