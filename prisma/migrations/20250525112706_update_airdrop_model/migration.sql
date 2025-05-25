/*
  Warnings:

  - You are about to drop the column `contract` on the `Airdrop` table. All the data in the column will be lost.
  - Added the required column `airdropAddress` to the `Airdrop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `Airdrop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainName` to the `Airdrop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `erc20Address` to the `Airdrop` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Airdrop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "airdropAddress" TEXT NOT NULL,
    "erc20Address" TEXT NOT NULL,
    "chainName" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Airdrop" ("communityId", "createdAt", "creatorId", "id", "name") SELECT "communityId", "createdAt", "creatorId", "id", "name" FROM "Airdrop";
DROP TABLE "Airdrop";
ALTER TABLE "new_Airdrop" RENAME TO "Airdrop";
CREATE INDEX "Airdrop_communityId_idx" ON "Airdrop"("communityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
