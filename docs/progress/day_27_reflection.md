# Day 27 - PostgreSQL + Prisma Users

**Level**: Intermediate  
**Date**: March 27, 2026  
**Status**: ✅ Completed

## Objective
Integrate **PostgreSQL** database using **Prisma ORM** for type-safe database operations.

## Key Learnings
- Setting up Prisma with PostgreSQL
- Writing Prisma Schema and running migrations
- Using Prisma Client for CRUD operations
- Working with CUID primary keys
- Environment variable configuration for database connection
- Using Docker for local PostgreSQL (recommended)

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **PostgreSQL**
- **Prisma** (ORM + CLI)
- **dotenv**

## Project Structure (Day 27)
```bash
day_27_postgres_prisma_users/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── config/
│   │   └── index.ts
│   ├── app.ts
│   └── index.ts
├── .env
├── tsconfig.json
├── package.json
└── docker-compose.yml
```



## How to Test (curl)

```bash
    # Create
        curl -X POST http://localhost:3026/api/users -H "Content-Type: application/json" -d '{"name":"Bhargavi","email":"bhargavi@example.com","age":25,"role":"USER"}'

    # Get All
        curl http://localhost:3026/api/users

    # Update (use real id)
        curl -X PUT http://localhost:3026/api/users/cmovfvj4k0000oqdv31hm2oah -H "Content-Type: application/json" -d '{"name":"Bhargavi Updated","age":26}'

    # Delete
        curl -X DELETE http://localhost:3026/api/users/cmovfvj4k0000oqdv31hm2oah
```

## Startup Output
```bash
🚀 Day 27 Server running on http://localhost:3026
✅ Prisma + PostgreSQL Connected
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint            | Description           | Status Code     |
|--------|---------------------|-----------------------|-----------------|
| GET    | `/api/users`        | Get all users         | 200             |
| POST   | `/api/users`        | Create user           | 201             |
| PUT    | `/api/users/:id`    | Update user           | 200 / 404       |
| DELETE | `/api/users/:id`    | Delete user           | 200 / 404       |


### Challenges Faced & Solved

- Setting up PostgreSQL with Docker
- Handling CUID string IDs instead of numbers
- Prisma migration and client generation
- Proper error handling for "record not found"

### Next Steps (Day 28 Preview)

- JWT Authentication + Login/Register
- Password hashing with bcrypt

---

**Status: ✅ Day 27 Successfully Completed**  
**Progress: 27/100 Days**

---

## Follow-up (October 7, 2026)

Changes made after this day during the code-quality review (see `assessment.md`):

- **Security fix:** `POST`/`PUT /api/users` used to pass `req.body` straight to Prisma, so a client could set `role: "ADMIN"` (mass assignment). Only `name`, `email` and `age` are accepted now (Zod whitelist).
- One `PrismaClient` per process in `src/lib/prisma.ts`; the client is generated to `generated/prisma` (see ADR-003 in `docs/architecture/system_design.md`).
- Prisma errors map to HTTP codes: duplicate email `409`, missing record `404`.
- `docker-compose.yml` reads `POSTGRES_*` from `.env` and binds to localhost only.
- 13 tests + real-Postgres checks in `pnpm smoke`.
- *(Round 3)* `:id` must be a cuid (`validateParams`), so malformed ids get 400 instead of reaching Prisma. Added `/health`, `/ready` (`SELECT 1`) and graceful shutdown (`prisma.$disconnect()` on SIGTERM).
