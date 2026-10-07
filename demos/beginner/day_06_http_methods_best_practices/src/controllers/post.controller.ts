import { Request, Response } from 'express';
import { Post } from '../types/post.types';

let posts: Post[] = [];

export class PostController {
  // GET - Safe, Idempotent, Cacheable
  static getAllPosts(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Posts fetched successfully",
      data: posts,
      count: posts.length
    });
  }

  static getPostById(req: Request, res: Response) {
    const { id } = req.params;
    const post = posts.find(p => p.id === parseInt(id));

    if (!post) {
      res.status(404).json({ success: false, error: "Post not found" });
      return;
    }

    res.json({ success: true, data: post });
  }

  // POST - Not Safe, Not Idempotent
  static createPost(req: Request, res: Response) {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      res.status(400).json({ success: false, error: "Title, content and author are required" });
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date()
    };

    posts.push(newPost);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost
    });
  }

  // PUT - Idempotent (replace entire resource)
  static updatePost(req: Request, res: Response) {
    const { id } = req.params;
    const { title, content, author, published } = req.body;
    const index = posts.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Post not found" });
      return;
    }

    posts[index] = {
      id: parseInt(id),
      title,
      content,
      author,
      published: published ?? false,
      createdAt: posts[index].createdAt
    };

    res.json({ success: true, message: "Post fully updated", data: posts[index] });
  }

  // PATCH - Partial Update (Not Idempotent in most cases)
  static partialUpdatePost(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const index = posts.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Post not found" });
      return;
    }

    posts[index] = { ...posts[index], ...updates };

    res.json({
      success: true,
      message: "Post partially updated",
      data: posts[index]
    });
  }

  // DELETE - Idempotent
  static deletePost(req: Request, res: Response) {
    const { id } = req.params;
    const index = posts.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      res.status(404).json({ success: false, error: "Post not found" });
      return;
    }

    const deleted = posts.splice(index, 1)[0];
    res.json({ success: true, message: "Post deleted successfully", data: deleted });
  }
}