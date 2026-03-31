# Demo 01 - Simple Task API (CRUD)

**Level**: Beginner

Basic RESTful CRUD API for managing tasks using Express + TypeScript.

## Endpoints

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/tasks`          | Get all tasks            |
| GET    | `/api/tasks/:id`      | Get task by ID           |
| POST   | `/api/tasks`          | Create a new task        |
| PUT    | `/api/tasks/:id`      | Update a task            |
| DELETE | `/api/tasks/:id`      | Delete a task            |

## How to Run

```bash
# From project root
pnpm install

# Run Demo 01
pnpm demo:01
```