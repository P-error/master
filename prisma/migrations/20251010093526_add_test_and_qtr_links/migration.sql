-- AlterTable
ALTER TABLE "QuestionTagResult" ADD COLUMN     "question" TEXT,
ADD COLUMN     "testId" INTEGER;

-- CreateTable
CREATE TABLE "Test" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "numQuestions" INTEGER NOT NULL,
    "numOptions" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionTagResult" ADD CONSTRAINT "QuestionTagResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
