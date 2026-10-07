import { Request, Response } from 'express';
import { Product } from '../types/product.types';

let products: Product[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 8000) + 299,
  category: ['Electronics', 'Fashion', 'Books', 'Home', 'Sports'][i % 5],
  rating: Math.random() * 4.5 + 0.5,
  stock: Math.floor(Math.random() * 150) + 5,
  createdAt: new Date(Date.now() - Math.random() * 10000000000)
}));

export class ProductController {
  static getProducts(req: Request, res: Response) {
    let filtered = [...products];

    const { 
      category, 
      minPrice, 
      maxPrice, 
      minRating, 
      search, 
      sort, 
      page = 1, 
      limit = 10 
    } = req.query;

    // Search
    if (search) {
      const term = (search as string).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term)
      );
    }

    // Filters
    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
    if (minRating) filtered = filtered.filter(p => p.rating >= Number(minRating));

    // Sorting
    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: paginated,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: { category, minPrice, maxPrice, minRating, search, sort }
    });
  }
}