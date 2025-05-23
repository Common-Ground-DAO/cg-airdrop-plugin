-- CreateTable
CREATE TABLE "Airdrop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AirdropItem" (
    "address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "airdropId" INTEGER NOT NULL,

    PRIMARY KEY ("address", "airdropId"),
    CONSTRAINT "AirdropItem_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "Airdrop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
