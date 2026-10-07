import type { Response } from 'express';

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorBody {
  success: false;
  message: string;
  errors: unknown;
  timestamp: string;
}

/**
 * Uniform response envelope used by every demo from Day 20 onward.
 */
export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response<SuccessBody<T>> {
    const body: SuccessBody<T> = { success: true, message, data, timestamp: new Date().toISOString() };
    return res.status(statusCode).json(body);
  }

  static error(res: Response, message: string, statusCode = 400, errors: unknown = null): Response<ErrorBody> {
    const body: ErrorBody = { success: false, message, errors, timestamp: new Date().toISOString() };
    return res.status(statusCode).json(body);
  }
}
