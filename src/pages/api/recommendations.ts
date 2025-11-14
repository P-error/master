// src/pages/api/recommendations.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type RecItem =
  | { type: "positive"; message: string }
  | { type: "negative"; message: string }
  | { type: "neutral"; message: string };

type Resp =
  | { summary: string; recommendations: RecItem[] }
  | { error: string };

// Человекочитаемые описания тегов (синхронно с TAG_LEGEND_V1 в generate-test.ts)
const TAG_LABELS: Record<string, string> = {
  ac: "академический стиль формулировок",
  fr: "дружественный / разговорный стиль",
  rw: "примеры из реального мира",
  ch: "сложные / подвоховые вопросы",
};

function pct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const auth = requireUser(req);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = auth.userId;

    // --- 1. История попыток, чтобы оценить общую точность ---
    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      select: {
        total: true,
        correct: true,
        accuracy: true,
      },
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        summary: "Пока нет данных для рекомендаций.",
        recommendations: [
          {
            type: "neutral",
            message:
              "Пройди несколько тестов по интересующим предметам — после этого я смогу подсказать, над чем лучше работать.",
          },
        ],
      });
    }

    let totalQuestions = 0;
    let totalCorrect = 0;

    for (const a of attempts) {
      totalQuestions += a.total ?? 0;
      totalCorrect += a.correct ?? 0;
    }

    const overallAccuracy =
      totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    // --- 2. Агрегированная статистика по тегам ---
    const tagRows = await prisma.userTagStat.findMany({
      where: { userId },
      select: {
        tag: true,
        total: true,
        correct: true,
        accuracy: true,
      },
    });

    const tags = tagRows
      .map((t) => ({
        tag: t.tag.trim(),
        total: t.total,
        correct: t.correct,
        accuracy:
          typeof t.accuracy === "number"
            ? t.accuracy
            : t.total > 0
            ? t.correct / t.total
            : 0,
      }))
      .filter((t) => t.tag && t.total > 0);

    const recommendations: RecItem[] = [];

    // --- 3. Общая точность: позитив / нейтраль / негатив ---
    if (overallAccuracy >= 0.85) {
      recommendations.push({
        type: "positive",
        message:
          "У тебя высокая общая точность ответов. Можно усложнять задания или добавлять больше 'подвоховых' вопросов.",
      });
    } else if (overallAccuracy >= 0.6) {
      recommendations.push({
        type: "neutral",
        message:
          "Общая точность на уверенном уровне. Продолжай в том же духе и постепенно увеличивай сложность.",
      });
    } else {
      recommendations.push({
        type: "negative",
        message:
          "Пока общая точность низкая. Попробуй выбирать режимы и темы попроще, а также внимательно разбирать ошибки после теста.",
      });
    }

    // Если нет данных по тегам — даём общую рекомендацию и выходим
    if (tags.length === 0) {
      recommendations.push({
        type: "neutral",
        message:
          "Пока недостаточно данных по тегам вопросов. Продолжай проходить тесты — и я смогу подсказать, какие типы заданий даются сложнее.",
      });

      return res.status(200).json({
        summary: `Средняя точность по всем ответам: ${pct(overallAccuracy)}%`,
        recommendations,
      });
    }

    // --- 4. Выделяем слабые и сильные теги ---
    // Берём только теги с хотя бы 3 вопросами, чтобы не реагировать на случайности
    const significant = tags.filter((t) => t.total >= 3);

    const weakTags = significant
      .filter((t) => t.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    const strongTags = significant
      .filter((t) => t.accuracy >= 0.85)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    const formatTagName = (code: string) =>
      TAG_LABELS[code] ? `${code} (${TAG_LABELS[code]})` : code;

    if (weakTags.length > 0) {
      const list = weakTags
        .map(
          (t) => `${formatTagName(t.tag)} — ${pct(t.accuracy)}% (вопросов: ${t.total})`
        )
        .join("; ");

      recommendations.push({
        type: "negative",
        message:
          "Есть теги, по которым результаты заметно ниже: " +
          list +
          ". Попробуй сконцентрироваться на таких вопросах: разбирать решения, повторять теорию и решать дополнительные примеры.",
      });
    }

    if (strongTags.length > 0) {
      const list = strongTags
        .map(
          (t) => `${formatTagName(t.tag)} — ${pct(t.accuracy)}% (вопросов: ${t.total})`
        )
        .join("; ");

      recommendations.push({
        type: "positive",
        message:
          "Сильные стороны: " +
          list +
          ". Можно использовать эти типы заданий для закрепления уверенности или как «разминку» перед более сложными вопросами.",
      });
    }

    if (weakTags.length === 0 && strongTags.length === 0) {
      recommendations.push({
        type: "neutral",
        message:
          "Распределение результатов по тегам достаточно ровное — нет ярко выраженных слабых или сильных сторон. Можно экспериментировать с режимами и темами, чтобы найти свои зоны роста.",
      });
    }

    return res.status(200).json({
      summary: `Средняя точность по всем ответам: ${pct(overallAccuracy)}%`,
      recommendations,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[recommendations] Error:", err);
    return res.status(500).json({ error: "Failed to calculate recommendations" });
  }
}
