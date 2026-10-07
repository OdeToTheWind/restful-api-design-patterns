# Day 24 - Simple Rate Limiting

**Level**: Beginner  
**Date**: March 24, 2026  
**Status**: ✅ Completed

## Objective
Implement **Rate Limiting** to protect the API from abuse, brute-force attacks, and excessive traffic using `express-rate-limit`.

## Key Learnings
- Why rate limiting is essential for API security and stability
- Configuring `express-rate-limit` middleware
- Global vs route-specific rate limiting
- Custom error messages and response format
- Understanding rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)
- Environment-based configuration

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **express-rate-limit**
- **ts-node**
- **dotenv**

## Project Structure (Day 24)
```bash
day_24_simple_rate_limiting/
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   └── test.controller.ts
│   ├── middleware/
│   │   └── rateLimiter.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── test.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── app.ts
│   └── index.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint                | Description          | Rate Limit Applied     |
|--------|-------------------------|----------------------|------------------------|
| GET    | `/api/test/ping`        | Test endpoint        | Yes (Global)           |

### Rate Limit Configuration

- **Max Requests**: 10 per minute (configurable via `.env`)
- **Window**: 60 seconds
- **Response on Limit Exceeded**: Proper rate limit error with clear message
```json
{
  "success": false,
  "error": "Too many requests, please try again later.",
  "limit": 10,
  "windowMinutes": 1
}
```

## Startup Output
```bash
🚀 Day 24 Server running on http://localhost:3023
🛡️  Rate Limiting: 10 requests per 1 minute(s)
```

### Testing

- Used repeated `curl` requests:  
  `curl http://localhost:3023/api/test/ping`
- Sent more than 10 requests within 1 minute
- Observed rate limit error after exceeding the limit

### Challenges Faced & Solved

- Proper TypeScript configuration for `express-rate-limit`
- Custom error response using existing `ApiResponse` utility
- Global middleware placement
- Environment-based configuration

### Next Steps (Day 25 Preview)

- MVC Architecture Refactor
- Organizing code in proper layers (Model, View, Controller)

---

**Status: ✅ Day 24 Successfully Completed**  
**Progress: 24/100 Days**  
**Milestone: Basic API protection with rate limiting implemented!**