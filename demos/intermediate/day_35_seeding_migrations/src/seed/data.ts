/**
 * Seed data is plain, deterministic data — no Math.random(), no Date.now() — so every
 * developer, test run and CI job gets exactly the same database.
 */
export type SeedProfile = 'minimal' | 'demo';

export interface SeedAuthor {
  email: string;
  name: string;
}

export interface SeedPost {
  slug: string;
  title: string;
  body: string;
  authorEmail: string;
  /** ISO date, or null for a draft */
  publishedAt: string | null;
}

const authors: SeedAuthor[] = [
  { email: 'ada@example.com', name: 'Ada Lovelace' },
  { email: 'grace@example.com', name: 'Grace Hopper' },
  { email: 'linus@example.com', name: 'Linus Torvalds' },
];

const topics = [
  'REST resource naming',
  'HTTP status codes',
  'Pagination strategies',
  'Idempotency keys',
  'Caching headers',
];

const demoPosts: SeedPost[] = authors.flatMap((author, a) =>
  topics.map((topic, t) => ({
    slug: `${topic.toLowerCase().replace(/\s+/g, '-')}-${a + 1}`,
    title: `${topic} (${author.name.split(' ')[0]}'s take)`,
    body: `Notes on ${topic.toLowerCase()} by ${author.name}.`,
    authorEmail: author.email,
    // Every fifth post is a draft; the rest are spread over fixed dates
    publishedAt: t === 4 ? null : new Date(Date.UTC(2026, 0, 1 + a * 5 + t)).toISOString(),
  })),
);

export const seedData: Record<SeedProfile, { authors: SeedAuthor[]; posts: SeedPost[] }> = {
  // Just enough for the app to start and the smoke test to have something to read
  minimal: { authors: authors.slice(0, 1), posts: demoPosts.slice(0, 2) },
  demo: { authors, posts: demoPosts },
};
