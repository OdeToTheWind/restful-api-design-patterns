import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';

let products = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 5000) + 299,
  category: ['Electronics', 'Fashion', 'Books'][i % 3]
}));

export class ProductController {
  static getAll(req: Request, res: Response) {
    ApiResponse.success(res, products, "Products fetched successfully");
  }

  static getById(req: Request, res: Response) {
    const { id } = req.params;
    const product = products.find(p => p.id === parseInt(id));

    if (!product) {
      return ApiResponse.error(res, "Product not found", 404);
    }

    ApiResponse.success(res, product, "Product found");
  }

  static create(req: Request, res: Response) {
    const newProduct = {
      id: Date.now(),
      ...req.body
    };
    products.push(newProduct);

    ApiResponse.success(res, newProduct, "Product created successfully", 201);
  }
}