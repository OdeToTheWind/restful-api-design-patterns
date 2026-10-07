# Day 09 - Path Parameters & Nested Resources

**Level**: Beginner  
**Date**: March 9, 2026  
**Status**: ✅ Completed

## Objective
Master the use of **Path Parameters** and implement **Nested Resources** (one-to-many relationships) following RESTful best practices.

## Key Learnings
- Using dynamic path parameters (`:userId`, `:postId`)
- Building **nested routes** (`/users/:userId/posts`)
- Using `mergeParams: true` to access parent route parameters
- Designing hierarchical resource relationships
- Proper route organization for scalable APIs
- Handling nested CRUD operations cleanly

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 9)
```bash
day_09_path_parameters_nesting/
├── src/
│   ├── controllers/
│   │   └── post.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── post.routes.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### API Endpoints Implemented (Nested Resources)

| Method | Endpoint                           | Description                            | Status Code     |
|--------|------------------------------------|----------------------------------------|-----------------|
| GET    | `/api/users/:userId/posts`         | Get all posts of a user                | 200             |
| GET    | `/api/users/:userId/posts/:postId` | Get specific post of a user            | 200 / 404       |
| POST   | `/api/users/:userId/posts`         | Create post for a user                 | 201 / 400       |

## Response Examples

**GET Nested Collection**:
```json
{
  "success": true,
  "message": "Posts for user 1",
  "data": [ ... ],
  "count": 3
}
```

**POST Create Nested Resource**:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 123456,
    "title": "My First Post",
    "content": "Hello World",
    "userId": 1
  }
}
```

## Startup Output
```bash
🚀 Day 9 Server running on http://localhost:3008
📍 Environment: development
🔗 Nested API Example: http://localhost:3008/api/users/1/posts
```

### Challenges Faced & Solved

- Understanding `mergeParams: true` for nested routes
- Accessing both `userId` and `postId` in the same controller
- Maintaining clean separation between routes and controllers
- Designing intuitive and RESTful nested URL structures

### Next Steps (Day 10 Preview)

- Global Error Handling Middleware
- Custom error classes
- Centralized error response formatting

---

**Status: ✅ Day 9 Successfully Completed**  
**Progress: 9/100 Days**  
**Milestone: Learned how to design nested RESTful resources properly!**
