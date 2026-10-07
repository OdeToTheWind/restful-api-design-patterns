import { Request, Response } from 'express';
import { Comment } from '../types';

let comments: Comment[] = [];

export class CommentController {
  static getPostComments(req: Request, res: Response) {
    const { postId } = req.params;
    const postComments = comments.filter(c => c.postId === parseInt(postId));

    res.json({
      success: true,
      message: `Comments for post ${postId}`,
      data: postComments,
      count: postComments.length
    });
  }

  static addComment(req: Request, res: Response) {
    const { postId } = req.params;
    const { author, content } = req.body;

    if (!author || !content) {
      res.status(400).json({ success: false, error: "Author and content are required" });
      return;
    }

    const newComment: Comment = {
      id: Date.now(),
      postId: parseInt(postId),
      author,
      content,
      createdAt: new Date()
    };

    comments.push(newComment);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment
    });
  }
}