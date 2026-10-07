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