import { Request, Response } from 'express';
import logger from '../utils/logger';

let users: any[] = [];

export class UserController {
  static createUser(req: Request, res: Response) {
    logger.info('Creating new user', { body: req.body });

    const newUser = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date()
    };

    users.push(newUser);

    logger.info('User created successfully', { userId: newUser.id });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser
    });
  }

  static getAllUsers(req: Request, res: Response) {
    logger.debug('Fetching all users', { count: users.length });
    res.json({ success: true, data: users, count: users.length });
  }
}