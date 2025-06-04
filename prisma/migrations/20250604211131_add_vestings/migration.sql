-- CreateTable
CREATE TABLE "Vesting" (
    "address" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,

    PRIMARY KEY ("contractAddress", "chainId")
);

-- CreateIndex
CREATE INDEX "Vesting_address_idx" ON "Vesting"("address");

-- CreateIndex
CREATE INDEX "Vesting_communityId_idx" ON "Vesting"("communityId");

-- CreateIndex
CREATE INDEX "Vesting_startTime_idx" ON "Vesting"("startTime");

-- CreateIndex
CREATE INDEX "Vesting_endTime_idx" ON "Vesting"("endTime");
