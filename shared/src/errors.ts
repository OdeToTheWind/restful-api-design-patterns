/**
 * An expected ("operational") error whose message is safe to send to the client.
 * Anything that is NOT an AppError is treated as a bug and answered with a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly errors: unknown;
  readonly isOperational = true;

  constructor(message: string, statusCode: number, errors: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
