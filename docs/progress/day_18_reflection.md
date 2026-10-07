# Day 18 - Idempotency (PUT & DELETE Best Practices)

**Level**: Beginner  
**Date**: March 18, 2026  
**Status**: ✅ Completed

## Objective
Understand and implement **Idempotency** — a critical concept in REST API design that ensures safe retries.

## Key Learnings
- What is idempotency and why it matters
- `PUT` is idempotent (replacing a resource)
- `DELETE` is idempotent (removing a resource)
- Difference between `POST` (not idempotent) vs `PUT`
- Handling "already deleted" or "already updated" scenarios gracefully
- Using same resource ID for create-or-update pattern

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 18)
```bash
day_18_idempotency_put_delete/
├── src/
│   ├── controllers/
│   │   └── order.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── order.routes.ts
│   ├── types/
│   │   └── order.types.ts
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

| Method | Endpoint              | Operation              | Idempotent? | Status Code    |
|--------|-----------------------|------------------------|-------------|----------------|
| PUT    | `/api/orders/:id`     | Create or Update       | Yes         | 201 / 200      |
| DELETE | `/api/orders/:id`     | Delete                 | Yes         | 200            |
| GET    | `/api/orders`         | List all orders        | Yes         | 200            |

### Key Takeaways

- **POST** → Not idempotent (creates a new resource every time)
- **PUT** → Idempotent (same result even on retry)
- **DELETE** → Idempotent (safe to call multiple times)
- Always return consistent success responses even on repeated calls

## Startup Output
```bash
🚀 Day 18 Server running on http://localhost:3017
🔗 Idempotency API: http://localhost:3017/api/orders
```

### Challenges Faced & Solved

- Implementing create-or-update logic in one PUT endpoint
- Handling "already deleted" case gracefully
- Demonstrating idempotency clearly with examples

### Next Steps (Day 19 Preview)

- PATCH Method for Partial Updates
- Advanced resource updates

---

**Status: ✅ Day 18 Successfully Completed**  
**Progress: 18/100 Days**  
**Milestone: Idempotency principles understood and implemented!**