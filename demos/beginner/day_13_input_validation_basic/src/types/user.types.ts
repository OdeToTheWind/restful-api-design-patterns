export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  role: 'user' | 'admin';
  createdAt: Date;
}
