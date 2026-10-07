# Day 06 - HTTP Methods Best Practices

**Level**: Beginner  
**Date**: March 6, 2026  
**Status**: ✅ Completed

## Objective
Master the correct usage of **HTTP Methods** following RESTful principles, understanding safety, idempotency, and real-world application of each method.

## Key Learnings
- Deep understanding of **HTTP Methods** semantics:
  - `GET` → Safe, Idempotent, Cacheable
  - `POST` → Not Safe, Not Idempotent (Create)
  - `PUT` → Idempotent (Full Replace)
  - `PATCH` → Partial Update
  - `DELETE` → Idempotent (Remove resource)
- Difference between **PUT** vs **PATCH**
- Proper status code usage (`201 Created`, `404 Not Found`, etc.)
- Designing clear, meaningful routes
- Building a practical example (Blog Posts) to demonstrate all methods

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 6)
```bash
day_06_http_methods_best_practices/
├── src/
│   ├── controllers/
│   │   └── post.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── post.routes.ts
│   ├── types/
│   │   └── post.types.ts
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

| Method | Endpoint              | Operation           | Idempotent? | Safe? | Status Codes     |
|--------|-----------------------|---------------------|-------------|-------|------------------|
| GET    | `/api/posts`          | List resources      | Yes         | Yes   | 200              |
| GET    | `/api/posts/:id`      | Get single          | Yes         | Yes   | 200 / 404        |
| POST   | `/api/posts`          | Create              | No          | No    | 201              |
| PUT    | `/api/posts/:id`      | Full Update         | Yes         | No    | 200 / 404        |
| PATCH  | `/api/posts/:id`      | Partial Update      | No          | No    | 200 / 404        |
| DELETE | `/api/posts/:id`      | Delete              | Yes         | No    | 200 / 404        |

### Key Takeaways

- **PUT** is idempotent — calling it multiple times gives the same result
- **POST** is not idempotent — each call creates a new resource
- Use **PATCH** for small/partial updates, **PUT** when replacing the entire object
- Always return meaningful success and error messages


## Response Examples

**POST Create**:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 1777235521129,
    "title": "Day 6 Learning",
    "content": "Understanding HTTP methods",
    "author": "SpireLab",
    "published": false
  }
}
```

**PATCH Partial Update**:
```json
{
  "success": true,
  "message": "Post partially updated",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Post not found"
}
```

## Startup Output
```bash
🚀 Day 6 Server running on http://localhost:3005
📍 Environment: development
🔗 Posts API: http://localhost:3005/api/posts
```

### Challenges Faced & Solved

- Clearly demonstrating the difference between PUT and PATCH
- Maintaining clean controller code while implementing all 5 HTTP methods
- Proper error handling for non-existing resources

### Next Steps (Day 7 Preview)

- Status Codes Mastery — Deep dive into proper usage of 2xx, 3xx, 4xx, 5xx
- Standardized error response format
- Custom error classes
- Global error handling middleware

---

**Status: ✅ Day 6 Successfully Completed**  
**Progress: 6/100 Days**  
**Milestone: Solid understanding of REST HTTP Methods achieved!**
