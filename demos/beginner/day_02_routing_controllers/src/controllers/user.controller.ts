import { Request, Response } from 'express';

export class UserController {
  static getAllUsers(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Users fetched successfully",
      data: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" }
      ]
    });
  }

  static getUserById(req: Request, res: Response) {
    const { id } = req.params;
    res.json({
      success: true,
      message: `User with ID ${id} fetched`,
      data: { id, name: "Alice", email: "alice@example.com" }
    });
  }

  static createUser(req: Request, res: Response) {
    const { name, email } = req.body;
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: Date.now(), name, email }
    });
  }
}