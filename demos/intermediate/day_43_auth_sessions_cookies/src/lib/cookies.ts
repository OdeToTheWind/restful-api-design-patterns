import type { CookieOptions, Response } from 'express';
import { config } from '../config';

export const REFRESH_COOKIE = 'refresh_token';
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'X-CSRF-Token';

const maxAge = config.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

// httpOnly: page JavaScript (and therefore XSS) can't read the refresh token.
// SameSite=Strict: the browser never attaches it to requests started by another site.
// Path=/api/auth: it's only sent to the endpoints that need it.
const refreshCookie: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge,
};

// Readable by the page on purpose: the client copies it into the X-CSRF-Token header
// (double-submit). Another site can make the browser *send* cookies, but can't *read* them.
const csrfCookie: CookieOptions = { ...refreshCookie, httpOnly: false, path: '/' };

export const setSessionCookies = (res: Response, refreshToken: string, csrfToken: string) => {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookie);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookie);
};

export const clearSessionCookies = (res: Response) => {
  const { maxAge: _maxAge, ...refresh } = refreshCookie;
  const { maxAge: _ignored, ...csrf } = csrfCookie;
  res.clearCookie(REFRESH_COOKIE, refresh);
  res.clearCookie(CSRF_COOKIE, csrf);
};
