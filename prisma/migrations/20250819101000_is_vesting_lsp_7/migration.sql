/*
  Warnings:

  - Added the required column `isLSP7` to the `Vesting` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vesting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "beneficiaryAddress" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTimeSeconds" INTEGER NOT NULL,
    "endTimeSeconds" INTEGER NOT NULL,
    "isLSP7" BOOLEAN NOT NULL,
    "verification" JSONB
);
INSERT INTO "new_Vesting" ("beneficiaryAddress", "chainId", "communityId", "contractAddress", "createdAt", "creatorId", "endTimeSeconds", "id", "name", "startTimeSeconds", "tokenAddress", "verification") SELECT "beneficiaryAddress", "chainId", "communityId", "contractAddress", "createdAt", "creatorId", "endTimeSeconds", "id", "name", "startTimeSeconds", "tokenAddress", "verification" FROM "Vesting";
DROP TABLE "Vesting";
ALTER TABLE "new_Vesting" RENAME TO "Vesting";
CREATE INDEX "Vesting_beneficiaryAddress_idx" ON "Vesting"("beneficiaryAddress");
CREATE INDEX "Vesting_communityId_idx" ON "Vesting"("communityId");
CREATE INDEX "Vesting_startTimeSeconds_idx" ON "Vesting"("startTimeSeconds");
CREATE INDEX "Vesting_endTimeSeconds_idx" ON "Vesting"("endTimeSeconds");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
