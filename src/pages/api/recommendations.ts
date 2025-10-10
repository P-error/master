import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

// replaced by prisma singleton

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Проверяем токен
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
    // Загружаем все результаты по тегам
    const tagResults = await prisma.questionTagResult.findMany({
      where: { userId },
    });

    if (!tagResults.length) {
      return res.status(200).json({ recommendations: [], summary: "Недостаточно данных для анализа" });
    }

    // Считаем статистику по каждому тегу
    const tagStats: Record<string, { total: number; correct: number }> = {};
    tagResults.forEach((r) => {
      const tags = (r.tags as string[]) || [];
      tags.forEach((tag) => {
        if (!tagStats[tag]) tagStats[tag] = { total: 0, correct: 0 };
        tagStats[tag].total++;
        if (r.isCorrect) tagStats[tag].correct++;
      });
    });

    const tagAccuracies = Object.entries(tagStats).map(([tag, stat]) => {
      return {
        tag,
        accuracy: stat.correct / stat.total,
        total: stat.total,
      };
    });

    // Средняя точность по всем тегам
    const avgAccuracy =
      tagAccuracies.reduce((acc, t) => acc + t.accuracy, 0) / tagAccuracies.length;

    const recommendations: any[] = [];

    tagAccuracies.forEach((t) => {
      if (t.total < 3) return; // слишком мало данных для выводов

      // Если тег сильно выше среднего → предложить усилить
      if (t.accuracy > avgAccuracy + 0.2) {
        recommendations.push({
          type: "positive",
          message: `Ваши ответы на вопросы с тегом "${t.tag}" успешнее на ${(t.accuracy * 100).toFixed(
            0
          )}% — рекомендуем добавить этот стиль/формат в ваши предпочтения.`,
        });
      }

      // Если тег сильно ниже среднего → предложить ослабить
      if (t.accuracy < avgAccuracy - 0.2) {
        recommendations.push({
          type: "negative",
          message: `Точность по вопросам с тегом "${t.tag}" ниже нормы (${(
            t.accuracy * 100
          ).toFixed(0)}%). Возможно, стоит снизить его приоритет.`,
        });
      }
    });

    // Если нет конкретных тегов с отклонениями
    if (recommendations.length === 0) {
      recommendations.push({
        type: "neutral",
        message: "Ваши результаты равномерны по всем тегам. Продолжайте тренировки!",
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
