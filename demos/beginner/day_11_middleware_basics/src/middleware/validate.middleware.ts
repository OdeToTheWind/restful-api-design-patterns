import { Request, Response, NextFunction } from 'express';

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, error: "Name must be at least 2 characters" });
    return;
  }

  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, error: "Valid email is required" });
    return;
  }

  next();
};