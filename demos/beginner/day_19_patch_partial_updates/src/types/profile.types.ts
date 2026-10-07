export interface UserProfile {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  website?: string;
  location?: string;
  updatedAt: Date;
}