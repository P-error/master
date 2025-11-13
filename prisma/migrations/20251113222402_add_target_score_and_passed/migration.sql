/*
  Warnings:

  - You are about to drop the column `rawQuestions` on the `TestAttempt` table. All the data in the column will be lost.
  - You are about to drop the `QuestionTagResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,name,difficulty]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `difficulty` on the `Subject` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `generatedTestId` to the `TestAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `TestAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagsVersion` to the `TestAttempt` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `difficulty` on the `TestAttempt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('ACADEMIC', 'COMFORT', 'RANDOM');

-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QuestionTagResult" DROP CONSTRAINT "QuestionTagResult_testId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QuestionTagResult" DROP CONSTRAINT "QuestionTagResult_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subject" DROP CONSTRAINT "Subject_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Test" DROP CONSTRAINT "Test_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Test" DROP CONSTRAINT "Test_userId_fkey";

-- DropIndex
DROP INDEX "public"."Subject_name_userId_key";

-- DropIndex
DROP INDEX "public"."TestAttempt_userId_subjectId_createdAt_idx";

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "description" TEXT,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL;

-- AlterTable
ALTER TABLE "TestAttempt" DROP COLUMN "rawQuestions",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "experimentArm" TEXT,
ADD COLUMN     "generatedTestId" INTEGER NOT NULL,
ADD COLUMN     "mode" "Mode" NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tagsVersion" TEXT NOT NULL,
ALTER COLUMN "subjectId" DROP NOT NULL,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL;

-- DropTable
DROP TABLE "public"."QuestionTagResult";

-- DropTable
DROP TABLE "public"."Test";

-- CreateTable
CREATE TABLE "GeneratedTest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "topic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "mode" "Mode" NOT NULL,
    "savable" BOOLEAN NOT NULL DEFAULT false,
    "tagsVersion" TEXT NOT NULL DEFAULT 'v1',
    "refinements" TEXT[],
    "numQuestions" INTEGER NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "numOptions" INTEGER NOT NULL DEFAULT 4,
    "prefSnapshot" JSONB,
    "plannedTagsPerQuestion" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "experimentArm" TEXT,
    "tagStrategy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" SERIAL NOT NULL,
    "generatedTestId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "qIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "answerIndex" INTEGER NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExample" (
    "id" SERIAL NOT NULL,
    "generatedTestId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "topic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionId" TEXT NOT NULL,
    "qIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagLegendVersion" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagLegendVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedTest_userId_createdAt_idx" ON "GeneratedTest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedTest_subjectId_createdAt_idx" ON "GeneratedTest"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "TestQuestion_subjectId_idx" ON "TestQuestion"("subjectId");

-- CreateIndex
CREATE INDEX "TestQuestion_tags_idx" ON "TestQuestion" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_generatedTestId_qIndex_key" ON "TestQuestion"("generatedTestId", "qIndex");

-- CreateIndex
CREATE INDEX "TrainingExample_generatedTestId_qIndex_idx" ON "TrainingExample"("generatedTestId", "qIndex");

-- CreateIndex
CREATE INDEX "TrainingExample_subjectId_createdAt_idx" ON "TrainingExample"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "TrainingExample_tags_idx" ON "TrainingExample" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "TagLegendVersion_version_key" ON "TagLegendVersion"("version");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Subject_userId_updatedAt_idx" ON "Subject"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_userId_name_difficulty_key" ON "Subject"("userId", "name", "difficulty");

-- CreateIndex
CREATE INDEX "TestAttempt_userId_createdAt_idx" ON "TestAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TestAttempt_subjectId_createdAt_idx" ON "TestAttempt"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "TestAttempt_generatedTestId_idx" ON "TestAttempt"("generatedTestId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedTest" ADD CONSTRAINT "GeneratedTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedTest" ADD CONSTRAINT "GeneratedTest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_generatedTestId_fkey" FOREIGN KEY ("generatedTestId") REFERENCES "GeneratedTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_generatedTestId_fkey" FOREIGN KEY ("generatedTestId") REFERENCES "GeneratedTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExample" ADD CONSTRAINT "TrainingExample_generatedTestId_fkey" FOREIGN KEY ("generatedTestId") REFERENCES "GeneratedTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
