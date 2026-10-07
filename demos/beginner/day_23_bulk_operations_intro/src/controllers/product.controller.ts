import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';
import { Product } from '../types/product.types';

let products: Product[] = [];

export class ProductController {
  // Bulk Create
  static bulkCreate(req: Request, res: Response) {
    const newProducts: Product[] = req.body.map((p: any, index: number) => ({
      id: Date.now() + index,
      name: p.name,
      price: p.price,
      category: p.category
    }));

    products.push(...newProducts);

    ApiResponse.success(res, newProducts, `${newProducts.length} products created successfully`, 201);
  }

  // Bulk Delete
  static bulkDelete(req: Request, res: Response) {
    const { ids } = req.body; // array of ids

    if (!Array.isArray(ids)) {
      return ApiResponse.error(res, "ids must be an array", 400);
    }

    const initialLength = products.length;
    products = products.filter(p => !ids.includes(p.id));

    const deletedCount = initialLength - products.length;

    ApiResponse.success(res, { deletedCount }, `${deletedCount} products deleted successfully`);
  }

  static getAll(req: Request, res: Response) {
    ApiResponse.success(res, products, "Products fetched successfully");
  }
}