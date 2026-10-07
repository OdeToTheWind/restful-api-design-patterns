# Day 01 - Basic Express Server Setup

**Level**: Beginner  
**Date**: March 1, 2026  
**Status**: ✅ Completed

## Objective
Set up a clean, professional, TypeScript-based Express server with proper project structure, environment configuration, and basic routing as the foundation for the 100-day RESTful API Design Patterns journey.

## Key Learnings
- Proper monorepo workspace setup with `pnpm`
- Creating a clean folder structure for scalable REST APIs
- TypeScript configuration (`tsconfig.json`) optimized for Node.js + ts-node
- Using `dotenv` for environment variable management
- Basic Express server initialization and middleware setup
- Creating organized routes (health check endpoint)
- Consistent console logging and startup messages
- Understanding CommonJS vs ESM issues in modern Node.js
- Importance of clear project scaffolding for long-term learning

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js** (core framework)
- **ts-node** (for running TypeScript directly)
- **dotenv** (environment variables)

## Project Structure Created
```bash
day_1_basic_express_server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app configuration
│   ├── config/
│   │   └── server.config.ts
│   └── routes/
│       └── health.routes.ts
├── tsconfig.json
├── package.json
└── .env.example
```
# API Development Progress

## API Endpoints Implemented

| Method | Endpoint          | Description              | Status Code |
|--------|-------------------|--------------------------|-------------|
| GET    | /                 | Welcome message          | 200         |
| GET    | /api/health       | Health check endpoint    | 200         |

## Response Examples

### Root Route (`/`)

```json
{
  "message": "Welcome to the API",
  "status": "success",
  "version": "1.0.0"
}
```
## Health Check (`/api/health`)

```json
{
  "status": "healthy",
  "timestamp": "2026-04-25T04:57:00.000Z",
  "uptime": "2h 30m"
}
```
## Startup Output
```bash
> pnpm dev

> my-api@1.0.0 dev /home/user/my-api
> ts-node src/index.ts

Server is running on http://localhost:3000
Database connected successfully
✅ All routes loaded
```
## Challenges Faced & Solved

- **pnpm workspace configuration** (`pnpm-workspace.yaml`)
- **tsconfig.json** compatibility with `ts-node`
- **CommonJS module resolution** issues
- **Missing folders/files** causing import errors

## Next Steps

- **Day 2**: Proper Routing + Controller Pattern
- Introduce separation of concerns
- Move toward more organized code structure

---

**Status: ✅ Day 1 Successfully Completed**