import { Request, Response } from 'express';
import { User } from '../types/user.types';
import bcrypt from 'bcryptjs';

let users: User[] = [];

export class UserController {
  static async register(req: Request, res: Response) {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: "Name, email and password are required" });
      return;
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
      res.status(409).json({ success: false, error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    };

    users.push(newUser);

    // Never return password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword
    });
  }

  static getAllUsers(req: Request, res: Response) {
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json({
      success: true,
      message: "Users fetched successfully",
      data: usersWithoutPassword,
      count: usersWithoutPassword.length
    });
  }

  static getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = users.find(u => u.id === parseInt(id));

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: userWithoutPassword,
      token: "demo-jwt-token-" + Date.now() // Simulated token
    });
  }
}