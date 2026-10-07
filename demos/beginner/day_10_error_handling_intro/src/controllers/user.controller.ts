import { Request, Response } from 'express';
import { AppError } from '../types/error.types';

let users: any[] = [];

export class UserController {
  static getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = users.find(u => u.id === parseInt(id));

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }

    res.status(200).json({ success: true, data: user });
  }

  static createUser(req: Request, res: Response) {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError('Name and email are required', 400);
    }

    if (users.find(u => u.email === email)) {
      throw new AppError('User with this email already exists', 409);
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      createdAt: new Date()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser
    });
  }

  static simulateServerError(req: Request, res: Response) {
    throw new Error('Unexpected database connection error');
  }
}