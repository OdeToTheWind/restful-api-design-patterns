# Day 43 - Cookie-based Sessions

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Move the refresh token from the JSON body into a **secure cookie**, protect cookie-authenticated endpoints from CSRF, and let users see and revoke their sessions.

## Key Learnings
- `httpOnly` cookies can't be read by page JavaScript, so an XSS bug can't steal the refresh token
- `SameSite=Strict` + `Path=/api/auth` keep the cookie off cross-site requests and off every other endpoint
- Double-submit CSRF: a readable `csrf_token` cookie must be copied into the `X-CSRF-Token` header — another site can make the browser send cookies, but can't read them
- A session = one login on one device; rotation keeps the same `sessionId`, so sessions are stable across refreshes
- The access token carries `sid`, so the API knows which session is "current"
- CORS with `credentials: true` requires explicit origins

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **cookie-parser**, **jsonwebtoken**, **bcryptjs**
- **Jest** + **Supertest**

## Project Structure (Day 43)
```
src/
├── lib/cookies.ts                ← cookie names + options (httpOnly, SameSite, Path)
├── services/session.service.ts   ← start / rotate / end / list / revoke sessions
├── middleware/auth.middleware.ts ← authenticate (with sid), requireCsrf, rate limit
└── controllers/auth.controller.ts
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Access token in body; refresh token in httpOnly cookie |
| POST | `/api/auth/refresh` | Rotate (cookie + `X-CSRF-Token`) |
| POST | `/api/auth/logout` | End this session (cookie + CSRF) |
| GET | `/api/auth/sessions` | My active sessions |
| DELETE | `/api/auth/sessions/:id` | Sign out one session |
| DELETE | `/api/auth/sessions` | Sign out everywhere else |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_43_auth_sessions_cookies
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- Cookies must be cleared with the same `Path` they were set with, otherwise the browser keeps them
- A failed refresh (expired or reused token) now also clears the cookies — a dead session's cookies are useless
- The smoke test drives the flow with a real cookie jar to confirm the `HttpOnly` flag and the CSRF check

### Next Steps
- Day 45: integration tests against a real database with Testcontainers
