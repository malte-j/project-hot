/*
  Warnings:

  - The primary key for the `Cursor` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cursor" (
    "deviceID" TEXT NOT NULL PRIMARY KEY,
    "cursor" INTEGER NOT NULL
);
INSERT INTO "new_Cursor" ("cursor", "deviceID") SELECT "cursor", "deviceID" FROM "Cursor";
DROP TABLE "Cursor";
ALTER TABLE "new_Cursor" RENAME TO "Cursor";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
