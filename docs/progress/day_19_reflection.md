# Day 19 - PATCH Method for Partial Updates

**Level**: Beginner  
**Date**: March 19, 2026  
**Status**: ✅ Completed

## Objective
Master the **PATCH** HTTP method for performing partial updates on resources — a very common and efficient pattern in modern REST APIs.

## Key Learnings
- Difference between **PUT** (Full Replace) vs **PATCH** (Partial Update)
- When to use PATCH (updating few fields without sending entire object)
- Implementing flexible partial updates
- Maintaining data consistency during partial modifications
- Proper status codes and response messages for PATCH operations

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 19)
```bash
day_19_patch_partial_updates/
├── src/
│   ├── controllers/
│   │   └── profile.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── profile.routes.ts
│   ├── types/
│   │   └── profile.types.ts
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

| Method | Endpoint                  | Operation         | Key Feature                     |
|--------|---------------------------|-------------------|---------------------------------|
| GET    | `/api/profiles/:id`       | Get profile       | Read                            |
| PATCH  | `/api/profiles/:id`       | Partial Update    | Only send changed fields        |

## Response Format

**Response Example (PATCH)**:
```json
{
  "success": true,
  "message": "Profile partially updated successfully",
  "data": {
    "id": 1,
    "name": "Badal",
    "bio": "Learning REST APIs",
    "website": "https://badal.in",
    "updatedAt": "..."
  }
}
```

## Startup Output
```bash
🚀 Day 17 Server running on http://localhost:3016
🔗 Nested Example: http://localhost:3016/api/posts/1/comments
```

### Challenges Faced & Solved

- Implementing clean partial update logic
- Deciding between PUT vs PATCH usage
- Ensuring only provided fields are updated
- Maintaining data integrity

### Next Steps (Day 20 Preview)

- Consistent Response Formatting
- Response Wrapper Utility
- Standardized API Response Structure

---

**Status: ✅ Day 19 Successfully Completed**  
**Progress: 19/100 Days**  
**Milestone: Full understanding of HTTP methods (GET, POST, PUT, PATCH, DELETE) achieved!**