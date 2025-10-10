import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("[statistics] API called:", req.method);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  try {
    // --- Тесты ---
    const tests = await prisma.test.findMany({
      where: { userId },
      include: { subject: true },
    });

    const totalTests = tests.length;
    const totalQuestions = tests.reduce((acc, t) => acc + t.numQuestions, 0);
    const totalCorrect = tests.reduce((acc, t) => acc + t.score, 0);
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // --- Статистика по предметам (теперь массив!) ---
    const subjectStatsMap = tests.reduce(
      (acc: Record<string, { total: number; correct: number }>, t) => {
        const subjName = t.subject ? `${t.subject.name} (${t.subject.difficulty})` : "Свободная тема";
        if (!acc[subjName]) acc[subjName] = { total: 0, correct: 0 };
        acc[subjName].total += t.numQuestions;
        acc[subjName].correct += t.score;
        return acc;
      },
      {}
    );

    const subjectStats = Object.entries(subjectStatsMap).map(([subject, v]) => ({
      subject,
      total: v.total,
      correct: v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    // --- Теги ---
    const tagResults = await prisma.questionTagResult.findMany({
      where: { userId },
    });

    const tagStatsMap: Record<string, { total: number; correct: number }> = {};
    tagResults.forEach((r) => {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      tags.forEach((tag) => {
        if (!tagStatsMap[tag]) tagStatsMap[tag] = { total: 0, correct: 0 };
        tagStatsMap[tag].total += 1;
        if (r.isCorrect) tagStatsMap[tag].correct += 1;
      });
    });

    const tagStats = Object.entries(tagStatsMap).map(([tag, v]) => ({
      tag,
      total: v.total,
      correct: v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    // --- Комбинации тегов ---
    const comboStatsMap: Record<string, { total: number; correct: number }> = {};
    tagResults.forEach((r) => {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      if (tags.length > 1) {
        const combo = tags.sort().join("+");
        if (!comboStatsMap[combo]) comboStatsMap[combo] = { total: 0, correct: 0 };
        comboStatsMap[combo].total += 1;
        if (r.isCorrect) comboStatsMap[combo].correct += 1;
      }
    });

    const comboStats = Object.entries(comboStatsMap).map(([combo, v]) => ({
      combo,
      total: v.total,
      correct: v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    return res.status(200).json({
      totalTests,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      subjectStats,
      tagStats,
      comboStats,
    });
  } catch (err) {
    console.error("[statistics] Error:", err);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
}
