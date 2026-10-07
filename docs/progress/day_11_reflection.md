# Day 11 - Middleware Basics

**Level**: Beginner  
**Date**: March 11, 2026  
**Status**: ✅ Completed

## Objective
Understand and implement **Middleware** in Express.js — the backbone of request processing in Node.js applications.

## Key Learnings
- What is middleware and how it works in the request-response cycle
- Order of middleware matters
- Built-in middleware: `express.json()`, `express.urlencoded()`, `cors()`
- Custom middleware:
  - Request logging middleware
  - Input validation middleware
- Global vs Route-specific middleware
- Placing error handling middleware at the end

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **cors**
- **ts-node**
- **dotenv**

## Project Structure (Day 11)
```bash
day_11_middleware_basics/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── middleware/
│   │   ├── logger.middleware.ts
│   │   └── validate.middleware.ts
│   ├── types/
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### Middleware Used

| Middleware              | Type      | Purpose                                      |
|-------------------------|-----------|----------------------------------------------|
| `cors()`                | Built-in  | Enable Cross-Origin Resource Sharing         |
| `express.json()`        | Built-in  | Parse JSON request body                      |
| `requestLogger`         | Custom    | Log all incoming requests with time          |
| `validateCreateUser`    | Custom    | Validate input before reaching controller    |
| Error Handler           | Global    | Centralized error handling                   |

### API Endpoints

| Method | Endpoint       | Description           | Middleware Applied          |
|--------|----------------|-----------------------|-----------------------------|
| GET    | `/api/users`   | Get all users         | Logger                      |
| POST   | `/api/users`   | Create user           | Logger + Validation         |

### Key Takeaways

- Middleware runs in sequence
- `next()` is crucial to pass control to the next middleware
- Custom middleware helps keep controllers clean
- Logging middleware is very useful for debugging


## Startup Output
```bash
🚀 Day 11 Server running on http://localhost:3010
📍 Environment: development
🔗 Users API: http://localhost:3010/api/users
```

### Challenges Faced & Solved

- Understanding middleware execution order
- Creating reusable validation middleware
- Properly implementing request timing logger

### Next Steps (Day 12 Preview)

- CORS Deep Dive & Environment Setup
- Advanced logging (Winston)
- Rate limiting basics

---

**Status: ✅ Day 11 Successfully Completed**  
**Progress: 11/100 Days**  
**Milestone: Middleware fundamentals mastered — a critical skill for professional API development!**
