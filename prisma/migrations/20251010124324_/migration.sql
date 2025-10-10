-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "byTag" JSONB NOT NULL,
    "byQuestion" JSONB NOT NULL,
    "rawQuestions" JSONB NOT NULL,
    "rawAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestAttempt_userId_subjectId_createdAt_idx" ON "TestAttempt"("userId", "subjectId", "createdAt");
