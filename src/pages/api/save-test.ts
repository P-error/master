// src/pages/api/save-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

// replaced by prisma singleton

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const token = cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: number };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { subjectId, topic, difficulty, questions, answers } = req.body;

  if (!topic || !Array.isArray(questions) || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // считаем score
    let score = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] && answers[i] === q.correct) score++;
    });

    // создаём Test
    const test = await prisma.test.create({
      data: {
        userId,
        subjectId: subjectId || null,
        topic,
        difficulty: difficulty || "medium",
        numQuestions: questions.length,
        numOptions: questions[0]?.options?.length || 4,
        score,
        questions, // сохраняем сырой JSON вопросов (вкл. tags)
      },
    });

    // создаём QuestionTagResult (по одному на вопрос)
    // ожидается, что questions[i].tags — массив строк, как вернул GPT
    const qtrPayload = questions.map((q: any, i: number) => {
      const tags = Array.isArray(q.tags) ? q.tags : [];
      const isCorrect = answers[i] && answers[i] === q.correct;
      return {
        userId,
        testId: test.id,
        question: String(q.question ?? ""),
        tags,          // Prisma.JsonValue
        isCorrect,     // boolean
      };
    });

    if (qtrPayload.length > 0) {
      // createMany не поддерживает Json в некоторых БД, если что — заменить на Promise.all(create)
      await prisma.questionTagResult.createMany({
        data: qtrPayload as any,
      });
    }

    return res.status(200).json({
      test,
      accuracy: Math.round((score / questions.length) * 100),
    });
  } catch (err) {
    console.error("[save-test] error:", err);
    return res.status(500).json({ error: "Failed to save test" });
  }
}
