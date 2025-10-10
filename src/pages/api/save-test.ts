import type { NextApiRequest, NextApiResponse } from "next";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";
import { prisma } from "@/lib/prisma"; // твой singleton
import type { TestQuestion } from "./generate-test";
import type { TestResult } from "./submitTest";

type SaveBody = {
  subjectId: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: TestQuestion[];
  answers: number[];
  result: TestResult; // объект из /api/submitTest
};

function bad(res: NextApiResponse, msg: string, code = 400) {
  return res.status(code).json({ error: msg });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method not allowed", 405);

  // ---- auth (как у тебя в раннем коде)
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const token = cookies.token;
  if (!token) return bad(res, "Not authenticated", 401);

  let userId: number;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: number };
    userId = decoded.userId;
  } catch {
    return bad(res, "Invalid token", 401);
  }

  let body: SaveBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return bad(res, "Invalid JSON");
  }

  const { subjectId, topic, difficulty, questions, answers, result } = body || {};
  if (!subjectId || !topic || !difficulty) return bad(res, "Missing subjectId/topic/difficulty");
  if (!Array.isArray(questions) || !questions.length) return bad(res, "questions required");
  if (!Array.isArray(answers) || answers.length !== questions.length) return bad(res, "answers length mismatch");
  if (!result || typeof result !== "object") return bad(res, "result required");

  try {
    // Примерная схема сохранения — подставь свои модели
    // Пример: TestAttempt { id, userId, subjectId, topic, difficulty, total, correct, accuracy, byTag (JSON), createdAt }
    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        subjectId,
        topic,
        difficulty,
        total: result.total,
        correct: result.correct,
        accuracy: result.accuracy,
        byTag: result.byTag as any,
        byQuestion: result.byQuestion as any,
        rawQuestions: questions as any,
        rawAnswers: answers as any,
      },
    });

    return res.status(200).json({ ok: true, id: attempt.id });
  } catch (err: any) {
    console.error("save-test error:", err?.message || err);
    return bad(res, "Failed to save attempt", 500);
  }
}
