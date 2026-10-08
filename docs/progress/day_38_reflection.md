# Day 38 - DTOs & Mappers for Audience-Specific Views

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Implement strict **Data Transfer Objects (DTOs)** and dedicated **entity mappers** for user profiles. The API must present distinct, tailored views depending on the requester's context—public users, authenticated account owners, and administrators—guaranteeing that sensitive database fields like password hashes, internal flags, and administrative notes are never inadvertently leaked.

## Key Learnings
- **The Pitfall of Returning Entities Directly**: Returning raw ORM database entities across HTTP endpoints creates immediate security vulnerabilities. Any newly added database column (such as internal flags, reset tokens, or fraud scores) is automatically broadcast over the wire unless explicitly stripped.
- **Explicit Field-by-Field Mappers**: Mappers must construct output objects by picking every field explicitly (`{ id: user.id, username: user.username }`) rather than relying on object spreading (`{ ...user }`) or deleting sensitive keys (`delete user.password`). If a new column is added to the database table, it remains hidden until intentionally mapped.
- **Hierarchical Audience Views**: Structuring DTOs in a clear mathematical hierarchy:
  - **Public View**: Minimal visibility (id, username, display name, public avatar).
  - **Private / Self View**: Personal profile information (email, phone, verified status, createdAt).
  - **Admin View**: Complete operational record (internal notes, role, lock status, security audit metadata).
- **Input DTOs as Whitelists**: Separate input DTOs (`RegisterInputDto`, `UpdateProfileInputDto`) prevent mass-assignment attacks by allowing only permitted attributes to reach update queries.
- **OpenAPI Schema Synchronization**: The Zod schemas defining output DTOs also serve as the OpenAPI response definitions, ensuring documentation and serialisation remain perfectly aligned.
- **Enforcing Leak-Free Contracts**: Testing endpoints with closed object schemas (`.strict()`) asserts that returning even one undeclared property immediately fails unit and contract tests.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Zod** (DTO validation and serialization)
- **jsonwebtoken** + **bcryptjs**
- **Jest** + **Supertest**

## Project Structure (Day 38)
```bash
day_38_dtos_mappers/
├── src/
│   ├── dtos/
│   │   └── user.dto.ts        # PublicUserDto, PrivateUserDto, AdminUserDto schemas
│   ├── mappers/
│   │   └── user.mapper.ts     # toPublicUser, toPrivateUser, toAdminUser transformation functions
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT verification and role enforcement
│   ├── controllers/
│   │   └── user.controller.ts # Handlers invoking mappers before serializing
│   ├── routes/
│   │   └── user.routes.ts
│   ├── app.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma          # User model with public, private, and internal columns
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Audience | Description | Status Code |
|--------|----------|----------|-------------|-------------|
| POST | `/api/auth/register` | Anonymous | Creates user and returns private profile view | 201 |
| POST | `/api/auth/login` | Anonymous | Authenticates and returns JWT + private view | 200 / 401 |
| GET | `/api/users/:id` | Public | Returns public profile view only | 200 / 404 |
| GET | `/api/me` | Authenticated | Returns private self view | 200 / 401 |
| PATCH | `/api/me` | Authenticated | Updates display name/bio via whitelisted DTO | 200 / 400 |
| GET | `/api/admin/users` | Admin | Returns comprehensive administrative view | 200 / 403 |
| PATCH | `/api/admin/users/:id/notes` | Admin | Updates internal staff notes | 200 / 403 |

## Mapper Implementation Pattern

```typescript
// src/mappers/user.mapper.ts
import { User } from '../generated/prisma';
import { PublicUser, PrivateUser, AdminUser } from '../dtos/user.dto';

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
});

export const toPrivateUser = (user: User): PrivateUser => ({
  ...toPublicUser(user),
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  emailVerified: user.emailVerified,
});

export const toAdminUser = (user: User): AdminUser => ({
  ...toPrivateUser(user),
  role: user.role,
  internalNotes: user.internalNotes,
  failedLoginAttempts: user.failedLoginAttempts,
  updatedAt: user.updatedAt.toISOString(),
});
```

## How to Run & Verify

```bash
cd demos/intermediate/day_38_dtos_mappers
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Run tests asserting exact DTO response keys and zero data leakage
pnpm test
```

### Challenges Faced & Solved
- **Intentional Field Leak Detection in Tests**: To test the robustness of the mapper layer, I wrote a test that intentionally mocks a user object containing an unmapped property (`secretFinancialToken`). The test asserts that neither the public nor private views leak the property over the wire.
- **Circular Module Loading with OpenAPI Extensions**: Calling `.openapi()` before `@restful/shared` finishes initializing the registry caused runtime undefined errors. I used Zod's native `.describe()` methods within DTO files to decouple schema definitions from OpenAPI registration sequencing.

### Next Steps
- Implement direct cloud storage uploads with pre-signed S3 URLs and background cleanup in Day 39.

---

**Status: ✅ Day 38 Successfully Completed**  
**Progress: 38/100 Days**  
**Milestone: Robust DTO and mapper architecture established, eliminating data leakage across public, private, and admin tiers.**
