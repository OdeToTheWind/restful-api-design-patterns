# Day 43 - Cookie-Based Sessions & CSRF Protection

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Elevate the JWT authentication system to enterprise web security standards: store refresh tokens inside **`httpOnly` secure cookies** to prevent XSS-based credential theft, implement **Double-Submit CSRF defense**, and give users granular visibility and revocation control over their active device sessions.

## Key Learnings
- **Defeating Token Theft with `httpOnly` Cookies**: Storing refresh tokens in browser `localStorage` or JavaScript memory makes them vulnerable to exfiltration if any script dependency suffers an XSS flaw. Placing refresh tokens inside `httpOnly` cookies ensures browser JavaScript cannot access the token.
- **Cookie Scope Restriction**: Setting `SameSite=Strict` and `Path=/api/auth` ensures browsers withhold the refresh cookie from third-party cross-site requests and from ordinary non-auth API endpoints.
- **Double-Submit Cookie CSRF Defense**: While `httpOnly` protects against XSS, browser cookie transmission is automatic, introducing Cross-Site Request Forgery (CSRF) risk on mutating endpoints. I implemented the Double-Submit pattern: the server sets a readable `csrf_token` cookie, and mutating endpoints require the client to mirror this value in an `X-CSRF-Token` header. Because the browser's Same-Origin Policy prevents foreign sites from reading cookies, attackers cannot supply the matching header.
- **Durable Session Tracking**: Each login creates a database `Session` record storing client metadata (`userAgent`, `ipAddress`, `lastActiveAt`). The short-lived access token embeds a session ID (`sid`), enabling the API to verify session validity and identify the current active device.
- **Session Lifecycle & Granular Revocation**:
  - `POST /api/auth/refresh`: Rotates the token while keeping `sessionId` stable.
  - `GET /api/auth/sessions`: Lists all active devices with an indicator for the current session.
  - `DELETE /api/auth/sessions/:id`: Revokes a specific remote session.
  - `DELETE /api/auth/sessions`: Revokes all sessions except the current one ("Sign out of all other devices").
- **Strict CORS with Credentials**: Enabling `credentials: true` in Express CORS requires explicit whitelist origins; wildcard `*` origins are rejected by browsers when credentials are transmitted.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **cookie-parser** + **jsonwebtoken** + **bcryptjs**
- **Jest** + **Supertest**

## Project Structure (Day 43)
```bash
day_43_auth_sessions_cookies/
├── src/
│   ├── lib/
│   │   └── cookies.ts             # Cookie names, expiration, and security options
│   ├── services/
│   │   └── session.service.ts      # Session creation, rotation, listing, and revocation
│   ├── middleware/
│   │   └── auth.middleware.ts      # authenticate (with sid), requireCsrf, rate limits
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── routes/
│   │   └── auth.routes.ts
│   ├── app.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma               # User and Session models
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Protection | Description | Status Code |
|--------|----------|------------|-------------|-------------|
| POST | `/api/auth/login` | Public | Returns access token in body + refresh token in httpOnly cookie | 200 / 401 |
| POST | `/api/auth/refresh` | Cookie + CSRF | Rotates refresh token and issues new access token | 200 / 401 |
| POST | `/api/auth/logout` | Cookie + CSRF | Ends current session and clears cookies | 200 |
| GET | `/api/auth/sessions` | Bearer Token | Lists all active device sessions for authenticated user | 200 / 401 |
| DELETE | `/api/auth/sessions/:id` | Bearer Token | Revokes a specific remote session | 204 / 404 |
| DELETE | `/api/auth/sessions` | Bearer Token | Revokes all other sessions except current | 204 |

## Double-Submit CSRF Middleware

```typescript
// src/middleware/auth.middleware.ts
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const cookieToken = req.cookies['csrf_token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new AppError('Invalid or missing CSRF token', 403);
  }

  next();
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_43_auth_sessions_cookies
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Run session lifecycle and security cookie tests
pnpm test
```

### Challenges Faced & Solved
- **Cookie Clearing Path Inconsistency**: During logout or token expiration, calling `res.clearCookie('refresh_token')` without specifying `path: '/api/auth'` caused browsers to silently ignore the clear instruction because the cookie was originally scoped to the subpath. Standardizing cookie options in a centralized utility ensured options match on both write and deletion.
- **Handling Failed Token Rotations**: If a refresh attempt fails because a token has expired or is reused maliciously, the middleware now explicitly clears the client cookies, ensuring dead sessions are cleanly invalidated immediately.
- **Cookie-Jar Testing**: Supertest does not maintain cookies by default. I utilized Supertest agent instances to maintain an active cookie jar across multiple requests to thoroughly verify `HttpOnly` flags and CSRF validation headers.

### Next Steps
- Master test doubles (mocks, stubs, fakes) and understand the limits of line coverage in Day 44.

---

**Status: ✅ Day 43 Successfully Completed**  
**Progress: 43/100 Days**  
**Milestone: Enterprise session security established with httpOnly cookies, Double-Submit CSRF defense, and multi-device session management.**
