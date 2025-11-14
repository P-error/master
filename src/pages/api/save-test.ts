// src/pages/api/save-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Difficulty } from "@prisma/client";

type ResultIn = {
  total: number;
  correct: number;
  accuracy: number;
  byTag?: Record<string, { total: number; correct: number }>;
  byQuestion?: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const subjectId = Number(body.subjectId);
    const topic = String(body.topic ?? "").trim();
    const difficulty = String(body.difficulty ?? "").trim() || "medium";
    const questions = body.questions;
    const answers = body.answers;
    const result: ResultIn = body.result;

    if (!Number.isFinite(subjectId)) return res.status(400).json({ error: "subjectId is required" });
    if (!topic) return res.status(400).json({ error: "topic is required" });
    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: "questions and answers must be arrays" });
    }
    if (!result || typeof result.total !== "number" || typeof result.correct !== "number") {
      return res.status(400).json({ error: "result is invalid" });
    }

    // Проверка владения предметом
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: auth.userId },
      select: { id: true },
    });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    const difficultyEnum = (difficulty ?? "MEDIUM") as Difficulty;

    const created = await prisma.testAttempt.create({
      data: {
        userId: auth.userId,
        subjectId,
        topic,
        difficulty: difficultyEnum,
        total: result.total,
        correct: result.correct,
        accuracy: result.total > 0 ? result.correct / result.total : 0,
        byTag: result.byTag ?? {},
        byQuestion: result.byQuestion ?? [],
      } as any,
      select: { id: true, createdAt: true },
    });

    res.status(200).json({ ok: true, id: created.id, createdAt: created.createdAt });
  } catch (err) {
    console.error("[/api/save-test] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
