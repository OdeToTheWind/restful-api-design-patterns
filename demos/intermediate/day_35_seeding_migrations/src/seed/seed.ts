import type { PrismaClient } from '../../generated/prisma';
import { SeedProfile, seedData } from './data';

export interface SeedResult {
  profile: SeedProfile;
  authors: number;
  posts: number;
}

/**
 * Idempotent: everything is an upsert on a natural unique key (author email, post slug), so the
 * seed can run on every `migrate reset`, every CI job, or by hand on an existing database
 * without creating duplicates. Re-running it also restores any seed rows edited by hand.
 */
export const seed = async (prisma: PrismaClient, profile: SeedProfile): Promise<SeedResult> => {
  const { authors, posts } = seedData[profile];

  return prisma.$transaction(async (tx) => {
    const authorIds = new Map<string, string>();
    for (const author of authors) {
      const row = await tx.author.upsert({
        where: { email: author.email },
        create: author,
        update: { name: author.name },
      });
      authorIds.set(author.email, row.id);
    }

    for (const post of posts) {
      const data = {
        title: post.title,
        body: post.body,
        published: post.publishedAt !== null,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        authorId: authorIds.get(post.authorEmail)!,
      };
      await tx.post.upsert({ where: { slug: post.slug }, create: { slug: post.slug, ...data }, update: data });
    }

    return { profile, authors: authors.length, posts: posts.length };
  });
};

export const parseProfile = (value: string | undefined): SeedProfile => {
  if (value === undefined || value === '') return 'demo';
  if (value === 'minimal' || value === 'demo') return value;
  throw new Error(`Unknown SEED_PROFILE "${value}" (expected "minimal" or "demo")`);
};
