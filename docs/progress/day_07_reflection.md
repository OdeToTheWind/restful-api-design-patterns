# Day 07 - HTTP Status Codes Mastery

**Level**: Beginner  
**Date**: March 7, 2026  
**Status**: ✅ Completed

## Objective
Master the correct and semantic usage of **HTTP Status Codes** in RESTful APIs — the language of the web.

## Key Learnings
- Proper usage of major status code families:
  - **2xx Success**: 200 OK, 201 Created, 204 No Content
  - **4xx Client Errors**: 400 Bad Request, 404 Not Found
  - **5xx Server Errors**: 500 Internal Server Error
- When to use each status code meaningfully
- Difference between `res.json()` vs `res.status().send()`
- Building meaningful error responses
- Real-world status code strategy for better API experience

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 6)
```bash
day_07_status_codes_mastery/
├── src/
│   ├── controllers/
│   │   └── task.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── task.routes.ts
│   ├── types/
│   │   └── task.types.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Endpoints & Status Codes

| Method | Endpoint                        | Success Status | Error Status     | Purpose |
|--------|---------------------------------|----------------|------------------|--------|
| GET    | `/api/tasks`                    | 200 OK         | -                | List resources |
| GET    | `/api/tasks/:id`                | 200 OK         | 404 Not Found    | Get single resource |
| POST   | `/api/tasks`                    | **201 Created**| 400 Bad Request  | Create resource |
| PUT    | `/api/tasks/:id`                | 200 OK         | 404 Not Found    | Full update |
| PATCH  | `/api/tasks/:id/complete`       | 200 OK         | 404 / 400        | Custom action |
| DELETE | `/api/tasks/:id`                | **204 No Content** | 404 Not Found | Delete resource |
| GET    | `/api/tasks/error`              | -              | **500 Server Error** | Error simulation |


### Key Takeaways

- **PUT** is idempotent — calling it multiple times gives the same result
- **POST** is not idempotent — each call creates a new resource
- Use **PATCH** for small/partial updates, **PUT** when replacing the entire object
- Always return meaningful success and error messages


## Response Examples

**Success (201 Created)**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { ... }
}
```

**Client Error (404 Not Found)**:
```json
{
  "success": false,
  "error": "Task not found"
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong on our end"
}
```

## Startup Output
```bash
🚀 Day 7 Server running on http://localhost:3006
📍 Environment: development
🔗 Status Codes API: http://localhost:3006/api/tasks
```

### Challenges Faced & Solved

- Using correct status codes instead of always returning `200`
- Proper use of `204 No Content` for successful DELETE operations
- Demonstrating realistic error scenarios with appropriate status codes

### Next Steps (Day 8 Preview)

- Query Parameters (Filtering & Pagination)
- Advanced request handling
- Better input validation

---

**Status: ✅ Day 7 Successfully Completed**  
**Progress: 7/100 Days**  
**Milestone: Professional-level understanding of HTTP Status Codes achieved!**
