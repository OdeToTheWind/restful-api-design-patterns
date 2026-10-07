# Day 26 - MongoDB + Mongoose Todos

**Level**: Intermediate  
**Date**: March 26, 2026  
**Status**: ✅ Completed

## Objective
Integrate **MongoDB** with **Mongoose** ODM — moving from in-memory storage to a real NoSQL database (First Intermediate Day).

## Key Learnings
- Connecting to MongoDB using Mongoose
- Defining Mongoose Schema and Model
- Performing CRUD operations with async/await
- Replacing in-memory array with database persistence
- Using Mongoose methods (`find()`, `create()`, `findByIdAndUpdate()`, `findByIdAndDelete()`)
- Environment-based MongoDB URI configuration

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **MongoDB**
- **Mongoose** (ODM)
- **dotenv**

## Project Structure (Day 26)
```bash
day_26_mongodb_mongoose_todos/
├── src/
│   ├── controllers/
│   │   └── todo.controller.ts
│   ├── models/
│   │   └── Todo.model.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── todo.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── config/
│   │   └── index.ts
│   ├── app.ts
│   └── index.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint            | Description           | Status Code     |
|--------|---------------------|-----------------------|-----------------|
| GET    | `/api/todos`        | Get all todos         | 200             |
| POST   | `/api/todos`        | Create todo           | 201             |
| PUT    | `/api/todos/:id`    | Update todo           | 200 / 404       |
| DELETE | `/api/todos/:id`    | Delete todo           | 200 / 404       |

## Startup Output
```bash
🚀 Day 26 Server running on http://localhost:3025
📦 MongoDB Mode Activated
✅ MongoDB Connected
```

### Challenges Faced & Solved

- Setting up Mongoose connection with proper error handling
- Converting from in-memory array to async database operations
- TypeScript integration with Mongoose models
- Managing environment variables for MongoDB URI

### Next Steps (Day 27 Preview)

- PostgreSQL + Prisma (Relational Database)
- Migrations and type-safe queries

---

**Status: ✅ Day 26 Successfully Completed**  
**Progress: 26/100 Days**  
**Milestone: Successfully moved to real database (MongoDB + Mongoose)!**