# Day 25 - MVC Architecture Refactor (Beginner Capstone)

**Level**: Beginner  
**Date**: March 25, 2026  
**Status**: ✅ Completed

## Objective
Refactor the entire application using **MVC (Model-View-Controller)** pattern — marking the completion of the Beginner Phase.

## Key Learnings
- Understanding MVC Architecture in Node.js/Express
- Separation of Concerns:
  - **Model** → Data logic & business rules
  - **Controller** → Request handling & response
  - **Route** → URL mapping
- Creating reusable classes (`TodoModel`, `ApiResponse`)
- Better code organization for scalability
- Preparing the foundation for Intermediate phase

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **ts-node**
- **dotenv**

## Project Structure (Day 25 - MVC)
```bash
day_25_mvc_refactor/
├── src/
│   ├── controllers/
│   │   └── todo.controller.ts
│   ├── models/
│   │   └── Todo.model.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── todo.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints (MVC Style)

| Method | Endpoint            | Controller Method   | Description          |
|--------|---------------------|---------------------|----------------------|
| GET    | `/api/todos`        | `getAll`            | List all todos       |
| POST   | `/api/todos`        | `create`            | Create todo          |
| PUT    | `/api/todos/:id`    | `update`            | Update todo          |
| DELETE | `/api/todos/:id`    | `delete`            | Delete todo          |

## Response Format (Consistent)

```json
{
  "success": true,
  "message": "Todos fetched successfully",
  "data": [ ... ],
  "timestamp": "2026-05-06T..."
}
```

## Startup Output
```bash
🚀 Day 25 Server running on http://localhost:3024
🏗️  MVC Architecture Applied!
🔗 Todos API: http://localhost:3024/api/todos
```

## Testing (Using curl)
```bash
  # GET All Todos
    curl http://localhost:3024/api/todos

  # CREATE Todo
    curl -X POST http://localhost:3024/api/todos \
      -H "Content-Type: application/json" \
      -d '{"title": "Complete 100 Days Challenge"}'

  # UPDATE Todo
    curl -X PUT http://localhost:3024/api/todos/17457xxxxxx \
      -H "Content-Type: application/json" \
      -d '{"title": "Master MVC", "completed": true}'

  # DELETE Todo
    curl -X DELETE http://localhost:3024/api/todos/17457xxxxxx
```
### Milestone Achieved

- Completed **Beginner Phase** (Days 1–25)
- Mastered core REST concepts
- Clean, maintainable, and scalable project structure

### Challenges Faced & Solved

- Properly separating concerns into Model, Controller, and Routes layers
- Creating reusable `TodoModel` class with CRUD methods
- Maintaining clean controller logic by delegating data operations to Model
- Ensuring consistent response format using `ApiResponse` utility
- Organizing project structure for future scalability

### Next Steps (Day 26 Preview)

- Moving from in-memory storage to **MongoDB + Mongoose**
- Introduction to real databases
- Schema design and ODM (Object Document Mapper)

---

**Status: ✅ Day 25 Successfully Completed**  
**Progress: 25/100 Days**  
**Milestone: Beginner Phase Completed (Days 1–25)! 🎉**