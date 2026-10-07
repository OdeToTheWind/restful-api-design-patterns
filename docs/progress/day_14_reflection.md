# Day 14 - Logging Setup (Winston)

**Level**: Beginner  
**Date**: March 14, 2026  
**Status**: ✅ Completed

## Objective
Implement professional **Structured Logging** using **Winston** — the most popular logging library for Node.js.

## Key Learnings
- Why proper logging is essential in production APIs
- Setting up Winston with multiple transports (Console + File)
- Structured JSON logging vs simple console.log
- Request logging middleware with timing
- Logging different levels (`info`, `debug`, `error`)
- Centralized logger utility
- Logging context (userId, method, path, duration, etc.)

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **Winston** (Structured Logging)
- **ts-node**
- **dotenv**

## Project Structure (Day 14)
```bash
day_14_logging_setup/
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── middleware/
│   │   └── logger.middleware.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── app.ts
│   └── index.ts
├── logs/                    # Auto-created
│   ├── combined.log
│   └── error.log
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### API Endpoints

| Method | Endpoint           | Description          | Logged Information                  |
|--------|--------------------|----------------------|-------------------------------------|
| POST   | `/api/users`       | Create user          | Request + Response + Timing         |
| GET    | `/api/users`       | Get all users        | Request details                     |


## Sample Log

**Sample Log Output**:
```json
{
  "level": "info",
  "message": "POST /api/users 201 - 12ms",
  "method": "POST",
  "path": "/api/users",
  "status": 201,
  "duration": 12,
  "timestamp": "2026-04-27 14:32:10"
}
```

## Startup Output
```bash
🚀 Day 14 Server running on http://localhost:3013
🔗 Users API: http://localhost:3013/api/users
```

### Challenges Faced & Solved

- Setting up Winston with proper formats and transports
- Creating a clean request logger middleware
- Logging without slowing down the API
- Organizing logger as a reusable utility

### Next Steps (Day 15 Preview)

- Pagination Basics
- Advanced Query Parameters
- Response formatting utilities

---

**Status: ✅ Day 14 Successfully Completed**  
**Progress: 14/100 Days**  
**Milestone: Professional structured logging system implemented!**