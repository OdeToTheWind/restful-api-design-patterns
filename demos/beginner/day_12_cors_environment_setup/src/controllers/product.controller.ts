import { Request, Response } from 'express';

let products = [
  { id: 1, name: "Laptop", price: 75000, category: "Electronics" },
  { id: 2, name: "Book", price: 499, category: "Education" },
];

export class ProductController {
  static getAll(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Products fetched",
      data: products
    });
  }
}   