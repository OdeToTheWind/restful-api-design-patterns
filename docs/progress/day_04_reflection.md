# Day 04 - Product Catalog CRUD

**Level**: Beginner  
**Date**: March 4, 2026  
**Status**: ✅ Completed

## Objective
Build a more realistic **Product Catalog API** with CRUD operations, basic filtering, and sorting — simulating a real e-commerce backend resource.

## Key Learnings
- Designing a richer resource model (`Product` interface)
- Implementing **query parameter handling** (`?category=...&sort=...`)
- Basic filtering and sorting logic in controllers
- Seeding initial data in memory
- Writing clean, maintainable controller methods
- Consistent API response structure with metadata (`count`, `filters`)
- Real-world thinking: category-based filtering, price sorting, stock management

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 4)
```bash
day_04_product_catalog_crud/
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

| Method | Endpoint                | Description                  | Key Features                  |
|--------|-------------------------|------------------------------|-------------------------------|
| GET    | `/api/products`         | Get all products             | Filtering + Sorting           |
| GET    | `/api/products/:id`     | Get product by ID            | Single resource retrieval     |
| POST   | `/api/products`         | Create new product           | Validation                    |
| PUT    | `/api/products/:id`     | Update product               | Partial updates               |
| DELETE | `/api/products/:id`     | Delete product               | Resource removal              |

### Query Parameters Supported

- `category` → Filter by category (e.g., `Electronics`, `Furniture`)
- `sort` → Sort options: `price-low`, `price-high`, `name`


## Response Examples

## Response Format (Standardized)

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [...],
  "count": 3,
  "filters": {
    "category": "Electronics",
    "sort": "price-low"
  }
}
```

## Startup Output
```bash
🚀 Day 4 Server running on http://localhost:3003
📍 Environment: development
🔗 Product Catalog: http://localhost:3003/api/products
```

### Challenges Faced & Solved

- Implementing query-based filtering and sorting logic
- Handling optional query parameters gracefully
- Maintaining clean controller code as features grow
- Seeding realistic sample data

### Next Steps (Day 5 Preview)

- User Management CRUD
- Better input validation
- Introduction to middleware

---

**Status: ✅ Day 4 Successfully Completed**  
**Progress: 4/100 Days**  
**Milestone: First API with query parameters and realistic business resource!**