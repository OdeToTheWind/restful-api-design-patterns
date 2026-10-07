# Day 03 - Todo CRUD In-Memory

**Level**: Beginner  
**Date**: March 3, 2026  
**Status**: ✅ Completed

## Objective
Build a full **CRUD (Create, Read, Update, Delete)** REST API for Todos using in-memory storage as the foundation for understanding resource management in RESTful design.

## Key Learnings
- Full CRUD implementation using Express + TypeScript
- In-memory data persistence pattern (array as temporary database)
- Proper usage of HTTP methods:
  - `GET` → Read (list + single resource)
  - `POST` → Create
  - `PUT` → Update
  - `DELETE` → Delete
- Dynamic route parameters (`:id`)
- Basic input validation (checking required fields)
- Consistent success/error response format
- Separation of Concerns: Controllers, Routes, Types
- Proper HTTP status codes (`200`, `201`, `404`, `400`)

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 3)
```bash
day_03_todo_crud_inmemory/
├── src/
│   ├── controllers/
│   │   └── todo.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── todo.routes.ts
│   ├── types/
│   │   └── todo.types.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### API Endpoints Implemented

| Method | Endpoint              | Description              | Status Code      |
|--------|-----------------------|--------------------------|------------------|
| GET    | `/api/todos`          | Get all todos            | 200              |
| GET    | `/api/todos/:id`      | Get todo by ID           | 200 / 404        |
| POST   | `/api/todos`          | Create new todo          | 201 / 400        |
| PUT    | `/api/todos/:id`      | Update todo              | 200 / 404        |
| DELETE | `/api/todos/:id`      | Delete todo              | 200 / 404        |
## Response Examples

## Response Format (Standardized)

```json
{
  "success": true,
  "message": "Todos fetched successfully",
  "data": [...],
  "count": 5
}
```

## Startup Output
```bash
🚀 Day 3 Server running on http://localhost:3002
📍 Environment: development
🔗 Todo API: http://localhost:3002/api/todos
```

### Challenges Faced & Solved

- Fixed corrupted `routes/index.ts` file (import errors)
- Proper TypeScript interface for Todo
- Handling `req.params` and `req.body` safely
- Maintaining clean and readable controller methods

### Next Steps (Day 4 Preview)

- Advanced query parameters (filtering, sorting, pagination)
- Better error handling middleware
- Response wrapper utility

---

**Status: ✅ Day 3 Successfully Completed**  
**Progress: 3/100 Days**  
**Milestone: First fully functional CRUD API achieved!**