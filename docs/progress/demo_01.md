# Demo 01 - Simple Task API (CRUD)

**Level**: Beginner  
**Date**: April 01, 2026  
**Status**: ✅ In Progress / Planned

## Objective
Build a clean, well-structured RESTful Task API using Express + TypeScript with full CRUD operations.

## Key Learnings
- Proper RESTful route design (`/tasks`, `/tasks/:id`)
- HTTP Methods: GET, POST, PUT, DELETE
- Correct usage of HTTP Status Codes (200, 201, 204, 400, 404)
- Consistent JSON response structure
- Separation of Concerns (Controller, Service, Routes)
- Basic error handling
- In-memory data storage (will be replaced with Prisma in later demos)
- Swagger/OpenAPI documentation setup (basic)

## Tech Stack Used
- Node.js + TypeScript
- Express.js
- Zod (for validation)
- ts-node-dev (for development)

## API Endpoints

| Method | Endpoint           | Description                  | Status Code |
|--------|--------------------|------------------------------|-------------|
| GET    | `/api/tasks`       | Get all tasks                | 200         |
| GET    | `/api/tasks/:id`   | Get task by ID               | 200 / 404   |
| POST   | `/api/tasks`       | Create new task              | 201         |
| PUT    | `/api/tasks/:id`   | Update task                  | 200 / 404   |
| DELETE | `/api/tasks/:id`   | Delete task                  | 204 / 404   |

## Response Format (Standard)
```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": [...]
}
```
```bash
  🚀 Demo 01 Server running on http://localhost:3001
  📍 Task API: http://localhost:3001/api/tasks
```