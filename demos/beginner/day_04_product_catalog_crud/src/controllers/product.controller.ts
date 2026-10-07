import { Request, Response } from 'express';
import { Product } from '../types/product.types';

let products: Product[] = [
  { id: 1, name: "Wireless Headphones", price: 2999, category: "Electronics", stock: 45, createdAt: new Date() },
  { id: 2, name: "Office Chair", price: 8999, category: "Furniture", stock: 12, createdAt: new Date() },
  { id: 3, name: "Notebook", price: 499, category: "Stationery", stock: 120, createdAt: new Date() },
];

export class ProductController {
  static getAllProducts(req: Request, res: Response) {
    const { category, sort } = req.query;

    let filtered = [...products];

    // Filter by category
    if (category) {
      filtered = filtered.filter(p => 
        p.category.toLowerCase() === (category as string).toLowerCase()
      );
    }

    // Sort
    if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: filtered,
      count: filtered.length,
      filters: { category, sort }
    });
  }

  static getProductById(req: Request, res: Response) {
    const { id } = req.params;
    const product = products.find(p => p.id === parseInt(id));

    if (!product) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }

    res.json({ success: true, data: product });
  }

  static createProduct(req: Request, res: Response) {
    const { name, price, category, stock, description } = req.body;

    if (!name || !price || !category) {
      res.status(400).json({ success: false, error: "Name, price and category are required" });
      return;
    }

    const newProduct: Product = {
      id: Date.now(),
      name,
      price: Number(price),
      category,
      stock: Number(stock) || 0,
      description,
      createdAt: new Date()
    };

    products.push(newProduct);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct
    });
  }

  static updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }

    products[index] = { ...products[index], ...req.body };
    res.json({ success: true, message: "Product updated", data: products[index] });
  }

  static deleteProduct(req: Request, res: Response) {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }

    const deleted = products.splice(index, 1)[0];
    res.json({ success: true, message: "Product deleted", data: deleted });
  }
}