/*
  Warnings:

  - You are about to drop the column `subjects` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Test" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "numQuestions" INTEGER NOT NULL,
    "numOptions" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questions" JSONB NOT NULL,
    CONSTRAINT "Test_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Test_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Test" ("createdAt", "difficulty", "id", "numOptions", "numQuestions", "questions", "score", "topic", "userId") SELECT "createdAt", "difficulty", "id", "numOptions", "numQuestions", "questions", "score", "topic", "userId" FROM "Test";
DROP TABLE "Test";
ALTER TABLE "new_Test" RENAME TO "Test";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "educationLevel" TEXT,
    "preffsubjects" TEXT,
    "learningGoal" TEXT,
    "preferredTone" TEXT,
    "detailLevel" TEXT,
    "learningStyle" TEXT,
    "priorKnowledge" TEXT,
    "preferredFormat" TEXT,
    "languageLevel" TEXT
);
INSERT INTO "new_User" ("age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge") SELECT "age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
