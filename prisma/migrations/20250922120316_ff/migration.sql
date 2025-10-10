/*
  Warnings:

  - You are about to alter the column `tags` on the `QuestionTagResult` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionTagResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "testId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionTagResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionTagResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuestionTagResult" ("createdAt", "id", "isCorrect", "question", "tags", "testId", "userId") SELECT "createdAt", "id", "isCorrect", "question", "tags", "testId", "userId" FROM "QuestionTagResult";
DROP TABLE "QuestionTagResult";
ALTER TABLE "new_QuestionTagResult" RENAME TO "QuestionTagResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
