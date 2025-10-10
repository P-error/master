-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "educationLevel" TEXT,
    "learningGoal" TEXT,
    "learningStyle" TEXT,
    "preferredFormat" TEXT,
    "preferredTone" TEXT,
    "detailLevel" TEXT,
    "priorKnowledge" TEXT,
    "languageLevel" TEXT,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "accessibleMode" BOOLEAN NOT NULL DEFAULT false,
    "fontSize" TEXT NOT NULL DEFAULT 'base'
);
INSERT INTO "new_User" ("age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge") SELECT "age", "detailLevel", "educationLevel", "id", "languageLevel", "learningGoal", "learningStyle", "login", "password", "preferredFormat", "preferredTone", "priorKnowledge" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
