# Day 15 - Pagination Intro

**Level**: Beginner  
**Date**: March 15, 2026  
**Status**: ✅ Completed

## Objective
Implement **Pagination** — one of the most important features for any list-based REST API to improve performance and user experience.

## Key Learnings
- Why pagination is necessary (performance, UX, bandwidth)
- Implementing `page` and `limit` query parameters
- Calculating `skip` and slicing data
- Returning rich pagination metadata
- Calculating `totalPages`, `hasNext`, `hasPrev`
- Keeping pagination logic clean in the controller

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 15)
```bash
day_15_pagination_intro/
├── src/
│   ├── controllers/
│   │   └── product.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── product.routes.ts
│   ├── types/
│   │   └── product.types.ts
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

| Method | Endpoint            | Key Query Params       | Description                        |
|--------|---------------------|------------------------|------------------------------------|
| GET    | `/api/products`     | `page`, `limit`        | Get paginated products             |


## Response Format

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "totalPages": 5,
    "currentPage": 2,
    "limit": 10,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Startup Output
```bash
🚀 Day 15 Server running on http://localhost:3014
🔗 Products API: http://localhost:3014/api/products?page=1&limit=10
```

### Challenges Faced & Solved

- Proper calculation of pagination metadata
- Handling default values for `page` and `limit`
- Avoiding off-by-one errors in array slicing
- Returning useful information for frontend pagination UI

### Next Steps (Day 16 Preview)

- Advanced Sorting & Filtering
- Combining filtering + sorting + pagination
- Query parameter best practices

---

**Status: ✅ Day 15 Successfully Completed**  
**Progress: 15/100 Days**  
**Milestone: First half of Beginner phase completed (15/25)!**