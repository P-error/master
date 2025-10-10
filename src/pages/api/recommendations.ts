import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

type RecItem =
  | { type: "positive"; message: string }
  | { type: "negative"; message: string }
  | { type: "neutral";  message: string };

type Resp =
  | { summary: string; recommendations: RecItem[] }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // JWT из cookie
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
    // Берём только нужные поля из БД (совместимо со схемой)
    const tagResults = await prisma.questionTagResult.findMany({
      where: { userId },
      select: { tags: true, isCorrect: true },
    });

    if (!tagResults.length) {
      return res.status(200).json({ recommendations: [], summary: "Недостаточно данных для анализа" });
    }

    // Счётчики по тегам
    const tagStats: Record<string, { total: number; correct: number }> = {};

    for (const r of tagResults) {
      const tags: string[] = Array.isArray(r.tags) ? r.tags.filter(t => typeof t === "string" && t.trim()) : [];
      if (tags.length === 0) continue;

      for (const tag of tags) {
        const key = tag.trim();
        if (!key) continue;

        if (!tagStats[key]) tagStats[key] = { total: 0, correct: 0 };
        tagStats[key].total++;
        if (r.isCorrect === true) tagStats[key].correct++;
      }
    }

    const entries = Object.entries(tagStats);
    if (entries.length === 0) {
      return res.status(200).json({
        recommendations: [{ type: "neutral", message: "Пока нет тегов для анализа. Продолжайте решать задания." }],
        summary: "Недостаточно данных по тегам",
      });
    }

    const tagAccuracies = entries.map(([tag, stat]) => ({
      tag,
      total: stat.total,
      accuracy: stat.total > 0 ? stat.correct / stat.total : 0,
    }));

    const avgAccuracy =
      tagAccuracies.reduce((acc, t) => acc + t.accuracy, 0) / tagAccuracies.length;

    const recommendations: RecItem[] = [];
    for (const t of tagAccuracies) {
      if (t.total < 3) continue; // слишком мало данных для выводов

      if (t.accuracy > avgAccuracy + 0.2) {
        recommendations.push({
          type: "positive",
          message: `Тег "${t.tag}" идёт заметно лучше среднего (${(t.accuracy * 100).toFixed(0)}%). Можно усилить его долю в рекомендациях.`,
        });
      } else if (t.accuracy < avgAccuracy - 0.2) {
        recommendations.push({
          type: "negative",
          message: `Точность по тегу "${t.tag}" ниже среднего (${(t.accuracy * 100).toFixed(0)}%). Имеет смысл снизить приоритет или добавить подсказки.`,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "neutral",
        message: "Результаты по тегам ровные — продолжайте в том же духе!",
      });
    }

    return res.status(200).json({
      summary: `Средняя точность: ${(avgAccuracy * 100).toFixed(0)}%`,
      recommendations,
    });
  } catch (err) {
    console.error("[recommendations] Error:", err);
    return res.status(500).json({ error: "Failed to calculate recommendations" });
  }
}
