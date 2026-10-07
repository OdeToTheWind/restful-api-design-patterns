# Day 08 - Query Parameters Filtering

**Level**: Beginner  
**Date**: March 8, 2026  
**Status**: ✅ Completed

## Objective
Learn how to handle **Query Parameters** for filtering, searching, sorting, and basic pagination — essential skills for building real-world RESTful APIs.

## Key Learnings
- Reading and processing `req.query` in Express
- Implementing search functionality (title + author)
- Category filtering
- Price range filtering (`minPrice`, `maxPrice`)
- Multiple sorting options (`price-low`, `price-high`, `newest`, `title`)
- Basic pagination (`page` & `limit`)
- Returning metadata (`pagination`, `filtersApplied`)
- Building flexible, user-friendly list endpoints

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 8)
```bash
day_08_query_parameters_filtering/
├── src/
│   ├── controllers/
│   │   └── book.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── book.routes.ts
│   ├── types/
│   │   └── book.types.ts
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

| Method | Endpoint       | Description                          | Key Query Params                          |
|--------|----------------|--------------------------------------|-------------------------------------------|
| GET    | `/api/books`   | Get books with advanced filtering    | `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |


## Response Examples

```json
{
  "success": true,
  "message": "Books fetched successfully",
  "data": [ ... ],
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "filtersApplied": {
    "search": "atomic",
    "category": null,
    "sort": "price-low"
  }
}
```
## Startup Output
```bash
🚀 Day 8 Server running on http://localhost:3007
📍 Environment: development
🔗 Books API: http://localhost:3007/api/books
```

### Challenges Faced & Solved

- Handling multiple optional query parameters cleanly
- Implementing robust filtering and sorting logic
- Returning useful pagination metadata
- Keeping controller code readable and maintainable

### Next Steps (Day 9 Preview)

- Path Parameters & Nested Resources
- Advanced route organization
- Better error handling patterns

---

**Status: ✅ Day 8 Successfully Completed**  
**Progress: 8/100 Days**  
**Milestone: Learned how to build powerful, flexible list endpoints using query parameters!**

