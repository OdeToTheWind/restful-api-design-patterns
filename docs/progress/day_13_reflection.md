# Day 13 - Input Validation Basics

**Level**: Beginner  
**Date**: March 13, 2026  
**Status**: ✅ Completed

## Objective
Implement robust **Input Validation** using **Zod** — the modern, TypeScript-first validation library.

## Key Learnings
- Why input validation is critical for API security and data integrity
- Using **Zod** schema validation
- Creating reusable validation middleware
- Detailed error messages with field-level feedback
- Schema reuse and composition
- Keeping controllers clean by moving validation to middleware

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **Zod** (schema validation)
- **ts-node**
- **dotenv**

## Project Structure (Day 13)
```bash
day_13_input_validation_basic/
├── src/
│   ├── config/
│   │   └── server.config.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── middleware/
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── types/
│   │   └── user.types.ts
│   ├── validators/
│   │   └── user.validator.ts
│   ├── app.ts
│   └── index.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### API Endpoints

| Method | Endpoint           | Description           | Validation Applied |
|--------|--------------------|-----------------------|--------------------|
| POST   | `/api/users`       | Create new user       | Zod Schema         |

## Validation Schema Example

```typescript
export const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
  role: z.enum(['user', 'admin']).default('user')
});
```

## Response Examples

**Success (201)**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { ... }
}
```

**Validation Error (400)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name must be at least 2 characters" },
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

## Startup Output
```bash
🚀 Day 13 Server running on http://localhost:3012
🔗 Test Validation: POST /api/users
```

### Challenges Faced & Solved

- Creating clean, reusable validation middleware
- Providing meaningful field-level error messages
- Integrating Zod with TypeScript seamlessly

### Next Steps (Day 14 Preview)

- Logging Setup (Winston)
- Structured logging
- Request context & correlation IDs

---

**Status: ✅ Day 13 Successfully Completed**  
**Progress: 13/100 Days**  
**Milestone: Secure input validation layer implemented!**