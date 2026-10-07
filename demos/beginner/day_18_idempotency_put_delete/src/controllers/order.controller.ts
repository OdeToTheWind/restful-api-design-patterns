import { Request, Response } from 'express';
import { Order } from '../types/order.types';

let orders: Order[] = [];

export class OrderController {
  // PUT - Idempotent (Safe to retry)
  static createOrUpdateOrder(req: Request, res: Response) {
    const { id } = req.params;
    const { customerName, amount } = req.body;

    if (!customerName || !amount) {
      res.status(400).json({ success: false, error: "Customer name and amount are required" });
      return;
    }

    const orderId = parseInt(id);
    const existingIndex = orders.findIndex(o => o.id === orderId);

    const order: Order = {
      id: orderId,
      customerName,
      amount: Number(amount),
      status: 'pending',
      createdAt: new Date()
    };

    if (existingIndex !== -1) {
      // Update (idempotent)
      orders[existingIndex] = order;
      res.json({ success: true, message: "Order updated successfully (idempotent)", data: order });
    } else {
      // Create
      orders.push(order);
      res.status(201).json({ success: true, message: "Order created successfully", data: order });
    }
  }

  // DELETE - Idempotent (Safe to retry)
  static deleteOrder(req: Request, res: Response) {
    const { id } = req.params;
    const orderId = parseInt(id);
    const index = orders.findIndex(o => o.id === orderId);

    if (index === -1) {
      // Already deleted or never existed → still success (idempotent)
      res.json({ success: true, message: "Order already deleted or does not exist" });
      return;
    }

    const deletedOrder = orders.splice(index, 1)[0];
    res.json({ success: true, message: "Order deleted successfully", data: deletedOrder });
  }

  static getAllOrders(req: Request, res: Response) {
    res.json({ success: true, data: orders, count: orders.length });
  }
}