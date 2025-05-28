-- CreateTable
CREATE TABLE "MerkleTree" (
    "airdropId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" JSONB NOT NULL,
    CONSTRAINT "MerkleTree_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "Airdrop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MerkleTree_airdropId_idx" ON "MerkleTree"("airdropId");
