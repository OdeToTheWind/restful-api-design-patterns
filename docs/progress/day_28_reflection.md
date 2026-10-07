# Day 28 - JWT Authentication

**Level**: Intermediate  
**Date**: March 28, 2026  
**Status**: ✅ Completed

## Objective
Implement **JWT-based Authentication** with user registration, login, and protected routes using Prisma + PostgreSQL.

## Key Learnings
- User registration with password hashing (`bcryptjs`)
- Login with password verification and JWT token generation
- Protected routes using custom authentication middleware
- Environment-based JWT secret management
- Using Docker for PostgreSQL database
- Proper error handling for auth flows (duplicate email, invalid credentials, etc.)

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **Prisma** (with PostgreSQL)
- **bcryptjs** (password hashing)
- **jsonwebtoken** (JWT)
- **Docker** (for PostgreSQL)

## Project Structure (Day 28)
```bash
day_28_jwt_authentication/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── auth.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── config/
│   │   └── index.ts
│   ├── app.ts
│   └── index.ts
├── docker-compose.yml
├── .env
├── tsconfig.json
├── package.json
└── prisma/schema.prisma
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint               | Description                        | Protected |
|--------|------------------------|------------------------------------|-----------|
| POST   | `/api/auth/register`   | User registration                  | No        |
| POST   | `/api/auth/login`      | User login + JWT token             | No        |
| GET    | `/api/auth/me`         | Get current user                   | Yes       |

## Docker Setup (PostgreSQL)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: restful_api_day28
```

**Start Database**:
```bash
    docker-compose up -d
```


## How to Test (curl)

```bash
    # Register
        curl -X POST http://localhost:3027/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"name":"Bhargavi","email":"bhargavi@example.com","password":"123456"}'

    # Login (Copy token from response)
        curl -X POST http://localhost:3027/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"bhargavi@example.com","password":"123456"}'

    # Protected Route
        curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3027/api/auth/me

    # Delete
        curl -X DELETE http://localhost:3026/api/users/cmovfvj4k0000oqdv31hm2oah
```

## Startup Output
```bash
🚀 Day 28 Server running on http://localhost:3027
🔐 JWT Authentication System is Ready
📝 Register : POST /api/auth/register
🔑 Login    : POST /api/auth/login
```

### Challenges Faced & Solved

- Setting up PostgreSQL using Docker
- Prisma migration and client generation
- JWT token generation and verification
- Protected route middleware
- Handling async database operations with proper error responses

### Next Steps (Day 29 Preview)

- Role-Based Access Control (RBAC)
- Authorization middleware for admin/user roles

---

**Status: ✅ Day 28 Successfully Completed**  
**Progress: 28/100 Days**  
**Milestone: Full JWT Authentication system with real database implemented!**

---

## Follow-up (October 7, 2026)

Changes made after this day during the code-quality review (see `assessment.md`):

- `JWT_SECRET` is required — the app refuses to start without it (the hardcoded fallback secret is gone).
- Register/login inputs validated with Zod (password 8–72 chars, email lowercased); auth routes rate-limited (`AUTH_RATE_LIMIT`, default 10 per 15 min per IP); login takes the same time whether or not the email exists.
- **Refresh tokens:** access tokens now last 15 minutes. Login also returns a `refreshToken`; `POST /api/auth/refresh` exchanges it for a new pair and revokes the old one; reusing a revoked token revokes all of the user's sessions; `POST /api/auth/logout` revokes it. Only SHA-256 hashes are stored (`refresh_tokens` table, migration `20261007120000_add_refresh_tokens`). See ADR-009.
- `/me` uses the typed `req.user` from `@restful/shared` — no more `(req as any).user`.
- 29 tests + real-Postgres checks of the whole token lifecycle in `pnpm smoke`.
