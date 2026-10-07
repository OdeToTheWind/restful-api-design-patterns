# Day 29 - Role-Based Access Control (RBAC)

**Level**: Intermediate  
**Date**: March 29, 2026  
**Status**: ✅ Completed

## Objective
Implement **Role-Based Access Control (RBAC)** using JWT tokens and custom authorization middleware.

## Key Learnings
- Role management in Prisma schema (`Role` enum)
- Creating authorization middleware (`authorizeRoles`)
- Protecting routes based on user roles
- Using JWT payload to carry role information
- Differentiating between authentication and authorization
- Building secure admin-only and user-only endpoints

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **Prisma** + **PostgreSQL**
- **jsonwebtoken**
- **bcryptjs**
- **Docker** (PostgreSQL)

## Project Structure (Day 29)
```bash
day_29_rbac_roles_permissions/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── rbac.middleware.ts
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
└── prisma/schema.prisma
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint               | Description                        | Access Level      |
|--------|------------------------|------------------------------------|-------------------|
| POST   | `/api/auth/register`   | Register new user                  | Public            |
| POST   | `/api/auth/login`      | Login and get JWT token            | Public            |
| GET    | `/api/users`           | Get all users                      | Authenticated     |
| GET    | `/api/users/admin`     | Admin-only dashboard               | ADMIN only        |

## Prisma Schema Highlight

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)   # USER / ADMIN / MODERATOR
  ...
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```


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
      POSTGRES_DB: restful_api_day29
```

**Start Database**:
```bash
    docker-compose up -d
```


## How to Test (curl)

```bash
    # Register a Normal User
        curl -X POST http://localhost:3028/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Bhargavi",
            "email": "bhargavi@example.com",
            "password": "123456"
        }'

    # Register an Admin User
        curl -X POST http://localhost:3028/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Admin User",
            "email": "admin@example.com",
            "password": "123456",
            "role": "ADMIN"
        }'

    # Login as Normal User (Copy the token)
        curl -X POST http://localhost:3028/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "bhargavi@example.com",
            "password": "123456"
        }'

    # Login as Admin (Copy the token)
        curl -X POST http://localhost:3028/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@example.com",
            "password": "123456"
        }'
    # Access Protected Route as Normal User (should work)
        curl -H "Authorization: Bearer YOUR_NORMAL_USER_TOKEN" http://localhost:3028/api/users

    # Access Admin Route as Normal User (should fail - 403)
        curl -H "Authorization: Bearer YOUR_NORMAL_USER_TOKEN" http://localhost:3028/api/users/admin

    # Access Admin Route as Admin User (should work)
        curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:3028/api/users/admin
```


## Startup Output
```bash
🚀 Day 29 Server running on http://localhost:3028
🔐 RBAC + JWT System Ready
```

### Challenges Faced & Solved

- Implementing role-based middleware
- Passing user role from JWT payload
- Managing multiple roles (`USER`, `ADMIN`, `MODERATOR`)
- Proper error responses for authorization failures (`403 Forbidden`)

### Next Steps (Day 30 Preview)

- Global Error Handling Middleware
- Advanced error management and logging

---

**Status: ✅ Day 29 Successfully Completed**  
**Progress: 29/100 Days**  
**Milestone: Role-Based Access Control (RBAC) system implemented!**

---

## Follow-up (October 7, 2026)

Changes made after this day during the code-quality review (see `assessment.md`):

- Same auth hardening as Day 28 (required secret, Zod validation, rate limiting, timing-safe login, 15-minute access tokens + rotating refresh tokens).
- **Security fix:** `GET /api/users` exposed every user's email to any logged-in `USER`; it now requires `ADMIN` or `MODERATOR`. `/api/users/admin` returns a real user count.
- `authorizeRoles(...roles: Role[])` uses the Prisma `Role` enum, so a typo like `'ADMN'` fails to compile.
- **API docs:** OpenAPI 3.1 generated from the Zod validators at `/api/docs/openapi.json`, Swagger UI at `/api/docs` (ADR-010).
- 40 tests + real-Postgres RBAC/token checks in `pnpm smoke`.
- *(Round 3)* Same per-account throttling, probes and graceful shutdown as Day 28. Contract tests now check real responses against the OpenAPI document. Undocumented fields fail, so a leaked password hash would be caught.
