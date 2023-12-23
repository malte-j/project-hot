-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "from" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Cursor" (
    "deviceID" TEXT NOT NULL,
    "cursor" INTEGER NOT NULL,

    PRIMARY KEY ("deviceID", "cursor")
);
