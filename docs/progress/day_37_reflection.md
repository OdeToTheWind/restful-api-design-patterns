# Day 37 - Repository and Service Layer

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Separate **HTTP**, **business rules** and **storage** in a Tasks API: controllers handle requests, a service enforces the workflow, and repositories hide Prisma behind an interface.

## Key Learnings
- Controller → service → repository: each layer has one reason to change
- The repository interface (`TaskRepository`) is the port; `PrismaTaskRepository` and `InMemoryTaskRepository` are interchangeable adapters
- Business rules (status workflow, due dates, no deleting completed tasks) live only in the service
- Dependency injection without a framework: `createApp({ taskService })` and a composition root in `index.ts`
- Injecting a clock (`now()`) makes time-based rules deterministic in tests
- Tests run real behaviour on the in-memory repository instead of asserting which Prisma methods were called

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **Jest** + **Supertest**

## Project Structure (Day 37)
```
src/
├── domain/task.ts                       ← types + allowed transitions (no Express/Prisma)
├── repositories/
│   ├── task.repository.ts               ← interface (port)
│   ├── prisma-task.repository.ts        ← production adapter
│   └── in-memory-task.repository.ts     ← test adapter
├── services/task.service.ts             ← business rules
├── controllers/task.controller.ts       ← createTaskController(service)
├── app.ts                               ← createApp(dependencies)
└── index.ts                             ← composition root
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?status=` | List (soonest due first) |
| POST | `/api/tasks` | Create (starts as TODO) |
| GET | `/api/tasks/:id` | One task |
| PATCH | `/api/tasks/:id` | Edit (not once DONE) |
| PUT | `/api/tasks/:id/status` | Workflow transition |
| DELETE | `/api/tasks/:id` | Delete (completed tasks are kept) |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_37_repository_service_layer
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- Status changes got their own sub-resource (`PUT /:id/status`) because they follow workflow rules, unlike plain edits
- Repeating a transition to the current status is a no-op, so retries are safe (idempotent)
- The in-memory repository had to reproduce Prisma's ordering (due date, nulls last) so both adapters behave the same

### Next Steps
- Day 38: control exactly what leaves the API with DTOs and mappers
