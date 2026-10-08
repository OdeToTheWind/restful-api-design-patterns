# Day 38 - DTOs and Mappers

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Return the **right view of a user to the right audience** — public, self, admin — by mapping entities to explicit DTOs instead of returning database rows.

## Key Learnings
- The entity holds everything; DTOs define what each audience may see
- Mappers build every field explicitly — never `{ ...user }`, never `delete user.password` — so new columns stay private by default
- Input DTOs (`registerDto`, `updateProfileDto`) are a separate whitelist of what clients may *send*
- Each view is a strict superset of the previous one (public ⊂ private ⊂ admin)
- DTO schemas double as the documented OpenAPI response shapes
- Contract tests with closed objects catch any leaked field

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **jsonwebtoken**, **bcryptjs**
- **Jest** + **Supertest**

## Project Structure (Day 38)
```
src/
├── dtos/user.dto.ts        ← output views + input DTOs (Zod)
├── mappers/user.mapper.ts  ← toPublicUser / toPrivateUser / toAdminUser / toUserCreateData
├── middleware/auth.middleware.ts
└── controllers/user.controller.ts
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register → private view |
| POST | `/api/auth/login` | Token + private view |
| GET | `/api/users/:id` | Public view (anyone) |
| GET | `/api/me` | Private view (self) |
| PATCH | `/api/me` | Update display name / bio |
| GET | `/api/admin/users` | Admin view (ADMIN) |
| PATCH | `/api/admin/users/:id/notes` | Set internal notes (ADMIN) |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_38_dtos_mappers
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- A test adds an unknown column to the entity and proves no view exposes it
- `.openapi()` only exists after `@restful/shared` is loaded, so DTO files use Zod's built-in `.describe()` to avoid import-order bugs

### Next Steps
- Day 43: move refresh tokens into secure cookies and add session management
