import { Request, Response } from 'express';
import { Product } from '../types/product.types';

let products: Product[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 5000) + 100,
  category: ['Electronics', 'Fashion', 'Books', 'Home'][i % 4],
  stock: Math.floor(Math.random() * 100) + 1
}));

export class ProductController {
  static getProducts(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const paginatedProducts = products.slice(skip, skip + limit);

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: paginatedProducts,
      pagination: {
        total: products.length,
        totalPages: Math.ceil(products.length / limit),
        currentPage: page,
        limit: limit,
        hasNext: page < Math.ceil(products.length / limit),
        hasPrev: page > 1
      }
    });
  }
}