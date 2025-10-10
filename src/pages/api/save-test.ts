// src/pages/api/save-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- auth: JWT из cookie ---
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

  // --- входные данные ---
  const { subjectId, topic, difficulty, questions, answers } = req.body ?? {};

  if (!topic || !Array.isArray(questions) || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // --- считаем score ---
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const a = answers[i];
      if (a != null && a === q?.correct) score++;
    }

    // --- создаём Test ---
    const test = await prisma.test.create({
      data: {
        userId,
        subjectId: subjectId ?? null,
        topic: String(topic),
        difficulty: String(difficulty ?? "medium"),
        numQuestions: questions.length,
        numOptions: Number(questions?.[0]?.options?.length ?? 4),
        score,
        questions, // Json: сохранится как есть
      },
    });

    // --- собираем payload для QuestionTagResult ---
    const qtrPayload = questions.map((q: any, i: number) => {
      const tags: string[] = Array.isArray(q?.tags)
        ? q.tags.filter((t: any) => typeof t === "string" && t.trim())
        : [];
      const isCorrect = answers[i] != null && answers[i] === q?.correct;

      return {
        userId,
        testId: test.id,                 // <-- связь на Test
        question: String(q?.question ?? ""),
        tags,                            // String[]
        isCorrect,                       // Boolean
      };
    });

    if (qtrPayload.length > 0) {
      await prisma.questionTagResult.createMany({ data: qtrPayload });
    }

    return res.status(200).json({
      testId: test.id,
      accuracy: Math.round((score / questions.length) * 100),
    });
  } catch (err) {
    console.error("[save-test] error:", err);
    return res.status(500).json({ error: "Failed to save test" });
  }
}
