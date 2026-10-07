# Day 17 - Nested Resources (Posts & Comments)

**Level**: Beginner  
**Date**: March 17, 2026  
**Status**: ✅ Completed

## Objective
Implement **Nested Resources** (one-to-many relationship) using proper RESTful URL design with path parameters.

## Key Learnings
- Designing nested routes (`/posts/:postId/comments`)
- Using `mergeParams: true` to access parent parameters
- Building hierarchical APIs (common in real-world apps)
- Organizing controllers and routes for nested resources
- Understanding resource ownership and relationships

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 17)
```bash
day_17_nested_resources_posts_comments/
├── src/
│   ├── controllers/
│   │   └── comment.controller.ts
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

### API Endpoints Implemented (Nested)

| Method | Endpoint                            | Description                          | Status Code     |
|--------|-------------------------------------|--------------------------------------|-----------------|
| GET    | `/api/posts/:postId/comments`       | Get all comments for a post          | 200             |
| POST   | `/api/posts/:postId/comments`       | Add comment to a post                | 201 / 400       |

## Response Format

**POST Create Comment**:
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": 1745758923456,
    "postId": 1,
    "author": "Alice",
    "content": "This is a great post!"
  }
}
```

**GET Comments**:
```json
{
  "success": true,
  "message": "Comments for post 1",
  "data": [ ... ],
  "count": 2
}
```

## Startup Output
```bash
🚀 Day 17 Server running on http://localhost:3016
🔗 Nested Example: http://localhost:3016/api/posts/1/comments
```

### Challenges Faced & Solved

- Correctly using `mergeParams: true` for nested routes
- Accessing both `postId` and comment data in the same controller
- Maintaining clean separation of concerns
- Designing intuitive nested URL structure

### Next Steps (Day 18 Preview)

- Idempotency (PUT & DELETE best practices)
- Partial updates with PATCH
- Advanced resource manipulation

---

**Status: ✅ Day 17 Successfully Completed**  
**Progress: 17/100 Days**  
**Milestone: Nested resource design mastered!**