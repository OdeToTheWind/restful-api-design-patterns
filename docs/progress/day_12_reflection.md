# Day 12 - CORS & Environment Setup

**Level**: Beginner  
**Date**: March 12, 2026  
**Status**: ✅ Completed

## Objective
Implement proper **CORS** configuration and professional **Environment Management** using `dotenv` and centralized config.

## Key Learnings
- What is CORS and why it's needed
- Secure CORS configuration with custom origin validation
- Using `helmet` for security headers
- Environment-based configuration (`development`, `production`)
- API Versioning using URL prefix (`/api/v1`)
- Centralized config management
- Health check endpoint best practices

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **cors**
- **helmet**
- **dotenv**

## Project Structure (Day 12)
```bash
day_12_cors_environment_setup/
├── src/
│   ├── config/
│   │   └── index.ts                 # Centralized environment config
│   ├── controllers/
│   │   └── product.controller.ts
│   ├── middleware/
│   │   └── cors.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── product.routes.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints

| Method | Endpoint                | Description                | Key Feature                  |
|--------|-------------------------|----------------------------|------------------------------|
| GET    | `/`                     | Welcome message            | Info                         |
| GET    | `/health`               | Health check               | Environment info             |
| GET    | `/api/v1/products`      | Main API endpoint          | Versioned                    |

### Important Configurations

- **CORS**: Restricted to allowed origins with credentials support
- **Helmet**: Automatic security headers
- **Environment**: Loaded from `.env` with fallback values
- **API Versioning**: URL-based (`/api/v1`)


## Startup Output
```bash
🚀 Day 11 Server running on http://localhost:3010
📍 Environment: development
🔗 Users API: http://localhost:3010/api/users
```

### Challenges Faced & Solved

- Secure CORS configuration (avoiding wildcard `*`)
- Centralized config pattern for scalability
- Proper middleware ordering
- Versioning strategy for future growth

### Next Steps (Day 13 Preview)

- Input Validation Basics (Zod)
- Request sanitization
- Advanced middleware patterns

---

**Status: ✅ Day 12 Successfully Completed**  
**Progress: 12/100 Days**  
**Milestone: Production-ready environment & security setup achieved!**