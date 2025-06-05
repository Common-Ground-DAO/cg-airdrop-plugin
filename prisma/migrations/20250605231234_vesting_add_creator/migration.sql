/*
  Warnings:

  - Added the required column `creatorId` to the `Vesting` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vesting" (
    "address" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,

    PRIMARY KEY ("contractAddress", "chainId")
);
INSERT INTO "new_Vesting" ("address", "chainId", "communityId", "contractAddress", "createdAt", "endTime", "startTime", "tokenAddress") SELECT "address", "chainId", "communityId", "contractAddress", "createdAt", "endTime", "startTime", "tokenAddress" FROM "Vesting";
DROP TABLE "Vesting";
ALTER TABLE "new_Vesting" RENAME TO "Vesting";
CREATE INDEX "Vesting_address_idx" ON "Vesting"("address");
CREATE INDEX "Vesting_communityId_idx" ON "Vesting"("communityId");
CREATE INDEX "Vesting_startTime_idx" ON "Vesting"("startTime");
CREATE INDEX "Vesting_endTime_idx" ON "Vesting"("endTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
