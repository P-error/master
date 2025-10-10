/*
  Warnings:

  - You are about to drop the column `isCorrect` on the `QuestionTagResult` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `QuestionTagResult` table. All the data in the column will be lost.
  - You are about to drop the column `testId` on the `QuestionTagResult` table. All the data in the column will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QuestionTagResult" DROP CONSTRAINT "QuestionTagResult_testId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Test" DROP CONSTRAINT "Test_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Test" DROP CONSTRAINT "Test_userId_fkey";

-- AlterTable
ALTER TABLE "QuestionTagResult" DROP COLUMN "isCorrect",
DROP COLUMN "question",
DROP COLUMN "testId",
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "difficulty" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."ChatMessage";

-- DropTable
DROP TABLE "public"."Test";
