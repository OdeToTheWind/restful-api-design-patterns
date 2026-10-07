# Day 30 - Global Error Middleware

**Level**: Intermediate  
**Date**: March 30, 2026  
**Status**: ✅ Completed

## Objective
Implement a **Centralized Global Error Handling Middleware** to catch and handle all errors consistently across the entire application.

## Key Learnings
- Creating a custom `AppError` class for operational errors
- Building a global error handling middleware
- Differentiating between operational errors and programming errors
- Consistent error response format across the API
- Proper placement of error middleware (must be last in the stack)
- Centralized logging of errors

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 30)
```bash
day_30_global_error_middleware/
├── src/
│   ├── controllers/
│   │   └── test.controller.ts
│   ├── middleware/
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── test.routes.ts
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

### API Endpoints for Testing

| Method | Endpoint                    | Purpose                        | Expected Status |
|--------|-----------------------------|--------------------------------|-----------------|
| GET    | `/api/test/success`         | Successful response            | 200             |
| GET    | `/api/test/bad-request`     | Custom 400 error               | 400             |
| GET    | `/api/test/not-found`       | Custom 404 error               | 404             |
| GET    | `/api/test/server-error`    | Unexpected 500 error           | 500             |


## Standardized Error Response

```json
{
  "success": false,
  "message": "Resource not found",
  "errors": null,
  "timestamp": "2026-05-07T..."
}
```

## Startup Output
```bash
🚀 Day 30 Server running on http://localhost:3029
🛡️  Global Error Handling Active
```

### Challenges Faced & Solved

- Ensuring error middleware catches both synchronous and asynchronous errors
- Creating reusable custom `AppError` class
- Maintaining clean controllers by throwing errors instead of sending responses
- Proper ordering of middleware (error handler must be last)

### Next Steps (Day 31 Preview)

- Swagger / OpenAPI Documentation
- Auto-generated interactive API docs

---

**Status: ✅ Day 30 Successfully Completed**  
**Progress: 30/100 Days**  
**Milestone: Professional centralized error handling system implemented — a key requirement for production-grade APIs!**

---

## Follow-up (October 7, 2026)

Changes made after this day during the code-quality review (see `assessment.md`):

- The global error handler built today graduated into `@restful/shared` (`errorHandler`, `notFoundHandler`, `AppError`) and is used by every demo from Day 26 onward. This demo now uses the shared version, so only one implementation exists.
- Fixed while moving it: the 404 handler was missing, and the error handler had been registered before the `/` route. Both are now registered after every route.
- Unexpected errors are logged with Winston together with the request's `X-Request-Id`; the client only ever sees `Internal Server Error`.
- 8 tests + checks in `pnpm smoke`.
