import { Request, Response } from 'express';
import { Post } from '../types';

let posts: Post[] = [];

export class PostController {
  static getUserPosts(req: Request, res: Response) {
    const { userId } = req.params;
    const userPosts = posts.filter(p => p.userId === parseInt(userId));

    res.json({
      success: true,
      message: `Posts for user ${userId}`,
      data: userPosts,
      count: userPosts.length
    });
  }

  static getPostById(req: Request, res: Response) {
    const { userId, postId } = req.params;
    const post = posts.find(p => p.id === parseInt(postId) && p.userId === parseInt(userId));

    if (!post) {
      res.status(404).json({ success: false, error: "Post not found" });
      return;
    }

    res.json({ success: true, data: post });
  }

  static createPost(req: Request, res: Response) {
    const { userId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, error: "Title and content are required" });
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title,
      content,
      userId: parseInt(userId),
      createdAt: new Date()
    };

    posts.push(newPost);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost
    });
  }
}