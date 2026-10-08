// Entry point for `prisma db seed` (also run automatically by `prisma migrate reset`).
// The logic lives in src/seed so it is type-checked with the app and unit-tested.
import prisma from '../src/lib/prisma';
import { parseProfile, seed } from '../src/seed/seed';

seed(prisma, parseProfile(process.env.SEED_PROFILE))
  .then((result) => console.log(`🌱 Seeded ${result.authors} authors and ${result.posts} posts (${result.profile})`))
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
