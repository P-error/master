-- CreateTable
CREATE TABLE "UserTagStat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "tag" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTagStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTagStat_userId_subjectId_idx" ON "UserTagStat"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "UserTagStat_userId_tag_idx" ON "UserTagStat"("userId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "UserTagStat_userId_subjectId_tag_key" ON "UserTagStat"("userId", "subjectId", "tag");

-- AddForeignKey
ALTER TABLE "UserTagStat" ADD CONSTRAINT "UserTagStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagStat" ADD CONSTRAINT "UserTagStat_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
