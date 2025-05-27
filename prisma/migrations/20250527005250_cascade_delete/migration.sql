-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AirdropItem" (
    "address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "airdropId" INTEGER NOT NULL,

    PRIMARY KEY ("address", "airdropId"),
    CONSTRAINT "AirdropItem_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "Airdrop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AirdropItem" ("address", "airdropId", "amount") SELECT "address", "airdropId", "amount" FROM "AirdropItem";
DROP TABLE "AirdropItem";
ALTER TABLE "new_AirdropItem" RENAME TO "AirdropItem";
CREATE INDEX "AirdropItem_airdropId_idx" ON "AirdropItem"("airdropId");
CREATE INDEX "AirdropItem_address_idx" ON "AirdropItem"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
