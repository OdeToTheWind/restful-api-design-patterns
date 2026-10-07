import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';

export class TestController {
  static ping(req: Request, res: Response) {
    ApiResponse.success(res, {
      message: "Pong! Rate limiting is active.",
      timestamp: new Date().toISOString()
    });
  }
}