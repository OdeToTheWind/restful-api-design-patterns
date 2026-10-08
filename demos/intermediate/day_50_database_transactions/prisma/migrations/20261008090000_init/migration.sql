-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfers_idempotencyKey_key" ON "transfers"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transfers_fromId_idx" ON "transfers"("fromId");

-- CreateIndex
CREATE INDEX "transfers_toId_idx" ON "transfers"("toId");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_toId_fkey" FOREIGN KEY ("toId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Added by hand: the database itself refuses a negative balance, as a last line of defence
-- behind the conditional debit in transfer.service.ts.
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_balance_non_negative" CHECK ("balanceCents" >= 0);
