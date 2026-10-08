import type { PrismaClient } from '../../generated/prisma';
import { seedData } from '../seed/data';
import { parseProfile, seed } from '../seed/seed';

const fakePrisma = () => {
  const tx = {
    author: {
      upsert: jest.fn(({ where }: { where: { email: string } }) => Promise.resolve({ id: `id-${where.email}` })),
    },
    post: { upsert: jest.fn().mockResolvedValue({}) },
  };
  const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
  return { prisma: prisma as unknown as PrismaClient, tx };
};

describe('seed data', () => {
  it.each(['minimal', 'demo'] as const)('%s: unique slugs, every post has a seeded author', (profile) => {
    const { authors, posts } = seedData[profile];
    const emails = new Set(authors.map((a) => a.email));

    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    expect(posts.every((p) => emails.has(p.authorEmail))).toBe(true);
    expect(posts.every((p) => /^[a-z0-9-]+$/.test(p.slug))).toBe(true);
  });

  it('is deterministic — the same input always produces the same rows', () => {
    expect(JSON.stringify(seedData)).toMatchSnapshot();
  });

  it('demo includes drafts, minimal is a subset of demo', () => {
    expect(seedData.demo.posts.some((p) => p.publishedAt === null)).toBe(true);
    expect(seedData.demo.posts).toEqual(expect.arrayContaining(seedData.minimal.posts));
  });
});

describe('seed()', () => {
  it('upserts on natural keys inside one transaction', async () => {
    const { prisma, tx } = fakePrisma();

    const result = await seed(prisma, 'demo');

    expect(result).toEqual({ profile: 'demo', authors: 3, posts: 15 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.author.upsert).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      create: { email: 'ada@example.com', name: 'Ada Lovelace' },
      update: { name: 'Ada Lovelace' },
    });
    const [firstPost] = tx.post.upsert.mock.calls[0];
    expect(firstPost.where).toEqual({ slug: seedData.demo.posts[0].slug });
    expect(firstPost.create.authorId).toBe('id-ada@example.com');
  });

  it('marks drafts as unpublished with no publishedAt', async () => {
    const { prisma, tx } = fakePrisma();
    await seed(prisma, 'demo');

    const draftSlug = seedData.demo.posts.find((p) => p.publishedAt === null)!.slug;
    const draft = tx.post.upsert.mock.calls.map(([args]) => args).find((args) => args.where.slug === draftSlug);
    expect(draft.update).toMatchObject({ published: false, publishedAt: null });
  });

  it('issues exactly the same writes when run twice (idempotent by construction)', async () => {
    const first = fakePrisma();
    const second = fakePrisma();
    await seed(first.prisma, 'minimal');
    await seed(second.prisma, 'minimal');

    expect(second.tx.post.upsert.mock.calls).toEqual(first.tx.post.upsert.mock.calls);
  });
});

describe('parseProfile', () => {
  it('defaults to demo and rejects unknown profiles', () => {
    expect(parseProfile(undefined)).toBe('demo');
    expect(parseProfile('minimal')).toBe('minimal');
    expect(() => parseProfile('huge')).toThrow(/Unknown SEED_PROFILE/);
  });
});
