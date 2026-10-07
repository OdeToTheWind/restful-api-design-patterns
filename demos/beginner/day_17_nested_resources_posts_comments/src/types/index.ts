export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: Date;
}