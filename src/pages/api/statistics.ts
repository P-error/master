// src/pages/api/statistics.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type SubjectStat = {
  subjectId: number | null;
  subjectName: string;
  attempts: number;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number; // 0..1
};

type TagStat = {
  tag: string;
  total: number;
  correct: number;
  accuracy: number; // 0..1
};

type TimelinePoint = {
  id: number;
  subjectId: number | null;
  subjectName: string;
  createdAt: string;
  accuracy: number; // 0..1
};

type StatsResponse = {
  totalTests: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number; // 0..1
  subjectStats: SubjectStat[];
  tagStats: TagStat[];
  timeline: TimelinePoint[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse | { error: string }>
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const auth = requireUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const userId = auth.userId;

    // --- Attempts history ---
    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        subjectId: true,
        total: true,
        correct: true,
        accuracy: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalTests = attempts.length;
    let totalQuestions = 0;
    let totalCorrect = 0;

    const subjectAgg = new Map<
      number | null,
      {
        subjectId: number | null;
        subjectName: string;
        attempts: number;
        totalQuestions: number;
        correctQuestions: number;
      }
    >();

    const timeline: TimelinePoint[] = [];

    for (const a of attempts) {
      const subjId = a.subjectId ?? null;
      const subjName = a.subject?.name ?? (subjId === null ? "Без предмета" : `#${subjId}`);

      totalQuestions += a.total ?? 0;
      totalCorrect += a.correct ?? 0;

      // Subject aggregation
      const key = subjId;
      const existing = subjectAgg.get(key);
      if (!existing) {
        subjectAgg.set(key, {
          subjectId: subjId,
          subjectName: subjName,
          attempts: 1,
          totalQuestions: a.total ?? 0,
          correctQuestions: a.correct ?? 0,
        });
      } else {
        existing.attempts += 1;
        existing.totalQuestions += a.total ?? 0;
        existing.correctQuestions += a.correct ?? 0;
      }

      // Timeline point
      const accuracy =
        typeof a.accuracy === "number"
          ? a.accuracy
          : a.total
          ? (a.correct ?? 0) / a.total
          : 0;

      timeline.push({
        id: a.id,
        subjectId: subjId,
        subjectName: subjName,
        createdAt: a.createdAt.toISOString(),
        accuracy,
      });
    }

    const overallAccuracy =
      totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    const subjectStats: SubjectStat[] = Array.from(subjectAgg.values())
      .map((s) => ({
        ...s,
        accuracy:
          s.totalQuestions > 0
            ? s.correctQuestions / s.totalQuestions
            : 0,
      }))
      // Самые важные предметы наверх: по кол-ву вопросов
      .sort((a, b) => b.totalQuestions - a.totalQuestions);

    // --- Tag stats from UserTagStat ---
    const userTagRows = await prisma.userTagStat.findMany({
      where: { userId },
      select: {
        tag: true,
        total: true,
        correct: true,
      },
    });

    const tagAgg = new Map<
      string,
      { tag: string; total: number; correct: number }
    >();

    for (const row of userTagRows) {
      const tag = row.tag.trim();
      if (!tag) continue;
      const existing = tagAgg.get(tag);
      if (!existing) {
        tagAgg.set(tag, {
          tag,
          total: row.total,
          correct: row.correct,
        });
      } else {
        existing.total += row.total;
        existing.correct += row.correct;
      }
    }

    const tagStats: TagStat[] = Array.from(tagAgg.values())
      .map((t) => ({
        ...t,
        accuracy: t.total > 0 ? t.correct / t.total : 0,
      }))
      // популярные теги наверх
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      totalTests,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      subjectStats,
      tagStats,
      timeline,
    });
  } catch (err) {
    console.error("[/api/statistics] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
