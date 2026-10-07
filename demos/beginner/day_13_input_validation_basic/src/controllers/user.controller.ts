import { Request, Response } from 'express';

let users: any[] = [];

export class UserController {
  static createUser(req: Request, res: Response) {
    const user = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date()
    };

    users.push(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });
  }
}