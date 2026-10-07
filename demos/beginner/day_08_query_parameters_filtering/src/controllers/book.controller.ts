import { Request, Response } from 'express';
import { Book } from '../types/book.types';

let books: Book[] = [
  { id: 1, title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", price: 499, publishedYear: 1988, createdAt: new Date() },
  { id: 2, title: "Atomic Habits", author: "James Clear", category: "Self-Help", price: 699, publishedYear: 2018, createdAt: new Date() },
  { id: 3, title: "Clean Code", author: "Robert C. Martin", category: "Technology", price: 1299, publishedYear: 2008, createdAt: new Date() },
  { id: 4, title: "The Psychology of Money", author: "Morgan Housel", category: "Finance", price: 599, publishedYear: 2020, createdAt: new Date() },
];

export class BookController {
  static getBooks(req: Request, res: Response) {
    let filtered = [...books];

    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;

    // Search in title or author
    if (search) {
      const term = (search as string).toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(term) || 
        b.author.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(b => b.category.toLowerCase() === (category as string).toLowerCase());
    }

    // Price range
    if (minPrice) filtered = filtered.filter(b => b.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(b => b.price <= Number(maxPrice));

    // Sorting
    if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'newest') filtered.sort((a, b) => b.publishedYear - a.publishedYear);
    if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: paginated,
      pagination: {
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(filtered.length / limitNum)
      },
      filtersApplied: { search, category, minPrice, maxPrice, sort }
    });
  }
}