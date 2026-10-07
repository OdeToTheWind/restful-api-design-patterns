/**
 * Payload stored in the JWT and attached to `req.user` by auth middleware.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/** Runtime guard for decoded JWT payloads — avoids an unchecked `as AuthUser` cast. */
export const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).id === 'string' &&
  typeof (value as Record<string, unknown>).email === 'string' &&
  typeof (value as Record<string, unknown>).role === 'string';

// Importing anything from @restful/shared applies this augmentation, so `req.user`
// is typed everywhere without `(req as any).user`.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by authentication middleware once the JWT is verified. */
      user?: AuthUser;
      /** Set by the `requestId` middleware; also sent back as the X-Request-Id header. */
      id?: string;
    }
  }
}
