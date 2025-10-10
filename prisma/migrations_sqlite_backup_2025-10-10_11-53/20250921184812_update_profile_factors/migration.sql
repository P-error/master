/*
  Warnings:

  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `languageStyle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pace` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `topics` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "educationLevel" TEXT,
    "subjects" TEXT,
    "learningGoal" TEXT,
    "preferredTone" TEXT,
    "detailLevel" TEXT,
    "learningStyle" TEXT,
    "priorKnowledge" TEXT,
    "preferredFormat" TEXT,
    "languageLevel" TEXT
);
INSERT INTO "new_User" ("age", "detailLevel", "educationLevel", "id", "learningStyle", "login", "password", "preferredFormat") SELECT "age", "detailLevel", "educationLevel", "id", "learningStyle", "login", "password", "preferredFormat" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
