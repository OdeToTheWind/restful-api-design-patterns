-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_url_key" ON "bookmarks"("url");

-- CreateIndex
CREATE INDEX "bookmarks_tags_idx" ON "bookmarks" USING GIN ("tags");

