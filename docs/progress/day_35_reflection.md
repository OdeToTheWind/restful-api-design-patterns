# Day 35 - Deterministic Database Seeding & Migrations

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Design and implement a **deterministic, idempotent database seeding system** and automated migration lifecycle. Every developer environment, integration test suite, and CI pipeline must boot against an identical, reliable baseline dataset without data duplication or race conditions.

## Key Learnings
- **Determinism Over Randomness**: Automated seed scripts should never rely on non-deterministic functions like `Math.random()` or dynamic timestamps like `Date.now()`. Using fixed, predictable fixtures guarantees that snapshot tests and regression runs remain completely repeatable.
- **Idempotency with Upsert on Natural Keys**: Implementing database operations via `upsert` targeting unique natural keys (such as author email and post slug) ensures that executing `pnpm seed` repeatedly leaves the database in an identical, uncorrupted state rather than failing on unique constraint violations or creating duplicate records.
- **Targeted Seeding Profiles**: Implementing profile selection (`SEED_PROFILE=minimal` for swift CI test fixtures versus `SEED_PROFILE=demo` for full feature exploration) accommodates different execution requirements.
- **Unit Testing Seed Logic**: Separating core seeding operations into `src/seed/seed.ts` allows the logic to be type-checked and executed against test databases or mocked clients, keeping `prisma/seed.ts` as a minimal CLI invocation stub.
- **Snapshot Testing Seed Fixtures**: Utilizing Jest snapshot testing against the generated seed structure ensures any modifications to initial datasets are caught and explicitly reviewed in pull requests.
- **Complete Environment Resets**: Leveraging `prisma migrate reset` drops tables, re-applies the migration sequence from scratch, and triggers the seed script in a single automated step.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Jest** (snapshot verification)

## Project Structure (Day 35)
```bash
day_35_seeding_migrations/
├── prisma/
│   ├── schema.prisma       # Author and Post models (slug as natural key)
│   ├── migrations/         # Versioned SQL migration files
│   └── seed.ts             # Entry point invoked by `prisma db seed`
├── src/
│   ├── seed/
│   │   ├── data.ts         # Profile-based deterministic fixtures
│   │   └── seed.ts         # Idempotent upserts wrapped in a Prisma transaction
│   ├── controllers/
│   │   └── post.controller.ts
│   ├── routes/
│   │   └── post.routes.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/posts` | List published posts ordered by publishedAt desc | 200 |
| GET | `/api/posts/:slug` | Retrieve single published post (draft slugs return 404) | 200 / 404 |
| GET | `/api/authors` | List authors with count of published articles | 200 |

## Idempotent Seed Implementation

```typescript
// src/seed/seed.ts
export async function seed(prisma: PrismaClient, profile: 'minimal' | 'demo' = 'demo') {
  const dataset = getSeedData(profile);

  return prisma.$transaction(async (tx) => {
    for (const authorData of dataset.authors) {
      const author = await tx.author.upsert({
        where: { email: authorData.email },
        update: { name: authorData.name, bio: authorData.bio },
        create: authorData
      });

      for (const postData of authorData.posts) {
        await tx.post.upsert({
          where: { slug: postData.slug },
          update: {
            title: postData.title,
            content: postData.content,
            published: postData.published,
            authorId: author.id
          },
          create: {
            ...postData,
            authorId: author.id
          }
        });
      }
    }
  });
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_35_seeding_migrations
cp .env.example .env
docker compose up -d

# Execute migration and seed
pnpm prisma:migrate
pnpm seed
pnpm db:reset   # Wipe, re-migrate, and re-seed cleanly

pnpm dev
pnpm test
```

### Challenges Faced & Solved
- **Draft Visibility Leaks**: The seed dataset intentionally includes unpublished draft articles to mirror real-world content management. This highlighted the need for strict filtering in all public endpoints (`where: { published: true }`), validated by our smoke test suite which verifies draft slugs return 404.
- **CI Snapshot Handling**: Jest snapshots cannot be updated during non-interactive `--ci` runs. I established the pattern of committing generated snapshot baselines so CI strictly asserts adherence to committed seed structures.

### Next Steps
- Implement the soft delete pattern in Day 36 using Prisma client extensions and PostgreSQL partial unique indexes.

---

**Status: ✅ Day 35 Successfully Completed**  
**Progress: 35/100 Days**  
**Milestone: Robust, idempotent database migration and profile-driven seeding pipeline established.**
