import { Request, Response } from 'express';

let users: any[] = [];

export class UserController {
  static createUser(req: Request, res: Response) {
    const { name, email } = req.body;

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

  static getAllUsers(req: Request, res: Response) {
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  }
}