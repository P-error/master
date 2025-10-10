/*
  Warnings:

  - You are about to drop the column `userId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `preffsubjects` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_UserSubjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UserSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Subject" ("id", "name") SELECT "id", "name" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "educationLevel" TEXT,
    "learningStyle" TEXT,
    "preferredFormat" TEXT,
    "preferredSubjects" TEXT,
    "preferredTone" TEXT,
    "detailLevel" TEXT,
    "priorKnowledge" TEXT,
    "languageLevel" TEXT,
    "learningGoal" TEXT
);
INSERT INTO "new_User" ("age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge") SELECT "age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_UserSubjects_AB_unique" ON "_UserSubjects"("A", "B");

-- CreateIndex
CREATE INDEX "_UserSubjects_B_index" ON "_UserSubjects"("B");
