# Day 02 - Routing & Controllers

**Level**: Beginner  
**Date**: March 2, 2026  
**Status**: ✅ Completed

## Objective
Implement clean **Routing** and **Controller Pattern** to improve code organization and maintainability in RESTful APIs.

## Key Learnings
- Separation of Concerns: Routes vs Controllers
- Creating dedicated `controllers/` and `routes/` folders
- Using **Class-based Controllers** with static methods (best practice for Express + TypeScript)
- Organizing routes with index files for better scalability
- Proper request/response handling with consistent JSON structure
- Using `req.params` and `req.body` effectively
- Importance of route organization as the project grows toward 100 demos

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 2)
```bash
day_02_routing_controllers/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
└── package.json
```
## API Development Progress

### API Endpoints Implemented

| Method | Endpoint            | Description              | Controller Method   | Status Code |
|--------|---------------------|--------------------------|---------------------|-------------|
| GET    | `/`                 | Welcome message          | -                   | 200         |
| GET    | `/api/users`        | Get all users            | `getAllUsers`       | 200         |
| GET    | `/api/users/:id`    | Get user by ID           | `getUserById`       | 200         |
| POST   | `/api/users`        | Create new user          | `createUser`        | 201         |

## Response Examples

## Response Format (Standardized)

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [...]
}
```

## Startup Output
```bash
🚀 Day 2 Server running on http://localhost:3001
📍 Environment: development
🔗 Users API: http://localhost:3001/api/users
```
### Challenges Faced & Solved

- Proper import paths between routes and controllers
- Understanding when to use `Router()` vs direct route registration
- Maintaining clean separation of concerns while keeping code simple for early days

### Next Steps (Day 3 Preview)

- Full CRUD operations with in-memory storage
- Better error handling
- Introduction to middleware

---

**Status: ✅ Day 2 Successfully Completed**  
**Progress: 2/100 Days**