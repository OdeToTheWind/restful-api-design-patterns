export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // Hashed password
  role: 'user' | 'admin';
  createdAt: Date;
}