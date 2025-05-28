-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MerkleTree" (
    "airdropId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" JSONB NOT NULL,
    CONSTRAINT "MerkleTree_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "Airdrop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MerkleTree" ("airdropId", "data") SELECT "airdropId", "data" FROM "MerkleTree";
DROP TABLE "MerkleTree";
ALTER TABLE "new_MerkleTree" RENAME TO "MerkleTree";
CREATE INDEX "MerkleTree_airdropId_idx" ON "MerkleTree"("airdropId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
