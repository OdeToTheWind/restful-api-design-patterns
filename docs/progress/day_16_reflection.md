# Day 16 - Advanced Sorting & Filtering Basics

**Level**: Beginner  
**Date**: March 16, 2026  
**Status**: ✅ Completed

## Objective
Build a powerful, flexible product listing API with **Advanced Filtering, Searching, Sorting, and Pagination** — a core skill for any real-world e-commerce or listing API.

## Key Learnings
- Handling multiple query parameters effectively
- Implementing search across multiple fields
- Category, price range, and rating filters
- Multiple sorting strategies (`price-low`, `price-high`, `rating`, `newest`, `name`)
- Combining filtering + sorting + pagination
- Returning rich metadata (`filters`, `pagination`)
- Writing clean, maintainable filter logic in controllers

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 16)
```bash
day_16_sorting_filtering_advanced_basics/
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

| Method | Endpoint            | Key Query Parameters                          | Features                                      |
|--------|---------------------|-----------------------------------------------|-----------------------------------------------|
| GET    | `/api/products`     | `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `sort`, `page`, `limit` | Full filtering + sorting + pagination         |

## Response Format

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10
  },
  "filters": {
    "category": "Electronics",
    "minPrice": "1000",
    "sort": "rating"
  }
}
```

## Startup Output
```bash
🚀 Day 16 Server running on http://localhost:3015
🔗 Advanced Products API: http://localhost:3015/api/products
```

### Challenges Faced & Solved

- Managing many optional query parameters cleanly
- Efficient filtering and sorting on in-memory data
- Combining all features without code duplication
- Providing useful response metadata for frontend

### Next Steps (Day 17 Preview)

- Nested Resources (Advanced)
- One-to-Many relationships simulation
- Better route organization for complex resources

---

**Status: ✅ Day 16 Successfully Completed**  
**Progress: 16/100 Days**  
**Milestone: Advanced query handling mastered — ready for real-world listing APIs!**