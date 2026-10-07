import { Request, Response } from 'express';
import { ApiResponse, AppError } from '@restful/shared';

export class TestController {
  static success(req: Request, res: Response) {
    ApiResponse.success(res, { message: "Everything is working fine!" });
  }

  static badRequest(_req: Request, _res: Response) {
    throw new AppError("Invalid input data", 400);
  }

  static notFound(_req: Request, _res: Response) {
    throw new AppError("Resource not found", 404);
  }

  static serverError(_req: Request, _res: Response) {
    throw new Error("Unexpected server crash simulation");
  }
}
