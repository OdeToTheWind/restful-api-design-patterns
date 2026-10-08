# Day 37 - Repository and Service Layer Pattern

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Decouple HTTP handling, core business logic, and database persistence in a Tasks API. Controllers must only parse and format HTTP messages, domain workflows must reside in a dedicated service layer, and data persistence must hide behind an abstract repository port with swappable adapters.

## Key Learnings
- **Separation of Concerns**: Structuring the API into Controller → Service → Repository gives each layer a single reason to change. HTTP changes (status codes, headers) only touch controllers; workflow rules (state transitions, business validations) live in services; database or schema updates only affect repository implementations.
- **Hexagonal / Ports & Adapters Architecture**: Defining a domain-level repository interface (`TaskRepository`) establishes an abstract port. The production application plugs in `PrismaTaskRepository`, while unit tests use a lightning-fast `InMemoryTaskRepository` without touching any database.
- **Workflow-Driven State Transitions**: Modeling task lifecycles (`TODO` → `IN_PROGRESS` → `DONE`) directly inside the service layer ensures that rules—such as disallowing changes to completed tasks or blocking deletion of finished work—cannot be bypassed by direct database mutations.
- **Lightweight Dependency Injection**: Implementing dependency injection without heavy reflection or third-party containers by using factory functions (`createApp({ taskService })`, `createTaskController(service)`) and composing them in `src/index.ts` (the composition root).
- **Clock Injection for Deterministic Testing**: Passing a pluggable clock function (`now: () => Date`) into domain services allows tests to simulate past, present, and future overdue task states deterministically.
- **Dedicated Sub-Resource for Lifecycle Actions**: Distinguishing general field editing (`PATCH /api/tasks/:id`) from workflow state transitions (`PUT /api/tasks/:id/status`) aligns HTTP semantics with domain operations.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Jest** + **Supertest**

## Project Structure (Day 37)
```bash
day_37_repository_service_layer/
├── src/
│   ├── domain/
│   │   └── task.ts                      # Domain entities and status transition rules
│   ├── repositories/
│   │   ├── task.repository.ts          # Port: abstract interface
│   │   ├── prisma-task.repository.ts   # Adapter: PostgreSQL / Prisma implementation
│   │   └── in-memory-task.repository.ts # Adapter: In-memory store for instant tests
│   ├── services/
│   │   └── task.service.ts             # Core business rules and validation
│   ├── controllers/
│   │   └── task.controller.ts          # Express request/response translation
│   ├── app.ts                          # createApp(dependencies) factory
│   └── index.ts                        # Production composition root
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/tasks` | List tasks filtered by status, ordered by due date | 200 |
| POST | `/api/tasks` | Create task (initialized to TODO status) | 201 |
| GET | `/api/tasks/:id` | Fetch task by identifier | 200 / 404 |
| PATCH | `/api/tasks/:id` | Update title, description, or due date (locked once DONE) | 200 / 400 / 404 |
| PUT | `/api/tasks/:id/status` | Transition task workflow state | 200 / 400 / 404 |
| DELETE | `/api/tasks/:id` | Remove task (completed tasks are archived and preserved) | 204 / 400 / 404 |

## Repository Port & Service Injection

```typescript
// src/repositories/task.repository.ts
export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findMany(filters?: TaskFilters): Promise<Task[]>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
}

// src/services/task.service.ts
export class TaskService {
  constructor(
    private readonly repo: TaskRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  async transitionStatus(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (task.status === newStatus) return task; // Idempotent no-op

    if (!isValidTransition(task.status, newStatus)) {
      throw new AppError(`Cannot transition from ${task.status} to ${newStatus}`, 400);
    }

    return this.repo.update(id, { status: newStatus });
  }
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_37_repository_service_layer
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Execute unit and integration tests against in-memory & Prisma adapters
pnpm test
```

### Challenges Faced & Solved
- **Adapter Ordering Discrepancies**: The `InMemoryTaskRepository` initially sorted items differently than PostgreSQL when encountering null due dates. I standardized sorting logic across both implementations so that tests running against in-memory storage faithfully mirror PostgreSQL's `NULLS LAST` behavior.
- **Idempotent State Transitions**: Clients retrying network requests when moving a task to `IN_PROGRESS` or `DONE` could receive error responses. Treating re-transitioning to the current state as a safe no-op returned 200 without throwing validation errors.

### Next Steps
- Implement Data Transfer Objects (DTOs) and mappers in Day 38 to strictly govern public, private, and administrative data views.

---

**Status: ✅ Day 37 Successfully Completed**  
**Progress: 37/100 Days**  
**Milestone: Clean Architecture layers established with abstract repository ports and testable domain services.**
