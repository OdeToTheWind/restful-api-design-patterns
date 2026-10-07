# Day 10 - Error Handling Introduction

**Level**: Beginner  
**Date**: March 10, 2026  
**Status**: ✅ Completed

## Objective
Implement clean, centralized, and professional **Error Handling** in Express.js using custom error classes and global error middleware.

## Key Learnings
- Creating custom `AppError` class extending Error
- Centralized error handling middleware
- Differentiating between operational errors and programming errors
- Consistent error response format across the API
- Proper use of HTTP status codes in error scenarios (`400`, `404`, `409`, `500`)
- Throwing errors from controllers instead of handling them inline
- Placing error middleware at the end of the middleware stack

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 10)
```bash
day_10_error_handling_intro/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── middleware/
│   │   └── error.middleware.ts
│   ├── types/
│   │   └── error.types.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints & Error Scenarios

| Method | Endpoint             | Scenario                        | Expected Status Code |
|--------|----------------------|---------------------------------|----------------------|
| POST   | `/api/users`         | Success                         | 201                  |
| POST   | `/api/users`         | Validation Error                | 400                  |
| POST   | `/api/users`         | Conflict (Duplicate)            | 409                  |
| GET    | `/api/users/:id`     | Resource Not Found              | 404                  |
| GET    | `/api/users/error`   | Unexpected Server Error         | 500                  |


## Standardized Error Response
```json
{
  "success": false,
  "error": "User with ID 99999 not found",
  "statusCode": 404,
  "timestamp": "2026-04-27T...",
  "path": "/api/users/99999"
}
```

## Startup Output
```bash
🚀 Day 10 Server running on http://localhost:3009
📍 Environment: development
🔗 Users API: http://localhost:3009/api/users
```

### Challenges Faced & Solved

- Creating a reusable custom error class
- Ensuring error middleware catches both thrown errors and async errors
- Maintaining clean controllers (no inline `res.status().json()`)
- Consistent error response structure across the API

### Next Steps (Day 11 Preview)

- Middleware Basics (Logging, CORS, Validation)
- Request logging
- Input sanitization

---

**Status: ✅ Day 10 Successfully Completed**  
**Progress: 10/100 Days**  
**Milestone: First 10 days completed! Strong foundation in REST API fundamentals established.**