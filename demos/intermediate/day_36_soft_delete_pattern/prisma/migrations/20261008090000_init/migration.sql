-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_deletedAt_idx" ON "articles"("deletedAt");


-- Added by hand: Prisma's schema language can't express partial indexes.
-- A slug must be unique among ACTIVE articles only, so a deleted article doesn't block
-- reusing its slug, and restoring it fails (P2002 → 409) if the slug was taken meanwhile.
-- Note: `prisma migrate dev` doesn't know this index; if a future generated migration
-- contains `DROP INDEX "articles_slug_active_key"`, remove that line before applying it.
CREATE UNIQUE INDEX "articles_slug_active_key" ON "articles"("slug") WHERE "deletedAt" IS NULL;
