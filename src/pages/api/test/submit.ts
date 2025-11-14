// pages/api/test/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type DiffPrisma = "EASY" | "MEDIUM" | "HARD";
type ModePrisma = "ACADEMIC" | "COMFORT" | "RANDOM";

// Поддерживаем два формата answers:
// A) [{ qIndex, chosenIndex }]
// B) number[] (индекс варианта по позиции вопроса; -1 если не отвечено)
type SubmitBody =
  | {
      generatedTestId?: number | string;
      sessionId?: number | string; // алиас
      subjectId?: number | string | null;
      answers: { qIndex: number | string; chosenIndex: number | string }[];
      durationMs?: number | string | null;
      startedAt?: string | null;
      completedAt?: string | null;
    }
  | {
      generatedTestId?: number | string;
      sessionId?: number | string; // алиас
      subjectId?: number | string | null;
      answers: (number | string)[];
      durationMs?: number | string | null;
      startedAt?: string | null;
      completedAt?: string | null;
    };

function bad(res: NextApiResponse, code: number, msg: string) {
  try {
    res.setHeader("X-Error-Message", msg);
  } catch {}
  // eslint-disable-next-line no-console
  console.error("[submit]", code, msg);
  return res.status(code).json({ error: msg });
}

function round1(x: number) {
  return Math.round(x * 100) / 100;
}

function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Нормализуем answers к виду [{ qIndex, chosenIndex }]
function normalizeAnswers(a: SubmitBody["answers"]): { qIndex: number; chosenIndex: number }[] {
  // Формат B: массив чисел/строк
  if (Array.isArray(a) && (typeof a[0] === "number" || typeof a[0] === "string")) {
    return (a as (number | string)[]).map((val, idx) => {
      const chosen = toNum(val);
      return { qIndex: idx, chosenIndex: chosen == null ? -1 : chosen };
    });
  }
  // Формат A: массив объектов
  const arr = a as { qIndex: number | string; chosenIndex: number | string }[];
  return arr.map((item, idx) => {
    const qi = toNum(item?.qIndex);
    let ci = toNum(item?.chosenIndex);
    if (qi == null) throw new Error(`answers[${idx}].qIndex must be a number`);
    if (ci == null) ci = -1; // неотвеченный
    return { qIndex: qi, chosenIndex: ci };
  });
}

// Загружаем тест и вопросы ТОЛЬКО из JSON (не обращаемся к таблице TestQuestion)
async function loadQuestionsFromJson(generatedTestId: number) {
  const test = await prisma.generatedTest.findUnique({
    where: { id: generatedTestId },
    select: {
      id: true,
      userId: true,
      subjectId: true,
      topic: true,
      difficulty: true,
      mode: true,
      tagsVersion: true,
      targetScore: true,
      questions: true, // JSON массив вопросов
    },
  });

  if (!test) return { error: "Test not found" as const };

  const raw = test.questions as
    | Array<{
        id?: string;
        prompt?: string;
        question?: string;
        options?: string[];
        answerIndex?: number;
        correctIndex?: number;
        tags?: string[];
      }>
    | undefined;

  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "Test has no questions to validate" as const };
  }

  const byIndex = new Map<
    number,
    { qIndex: number; prompt: string; options: string[]; answerIndex: number; tags: string[] }
  >();

  raw.forEach((q, i) => {
    const text = (q?.prompt ?? q?.question ?? "").toString();
    const options = Array.isArray(q?.options) ? q.options : [];
    const ans =
      typeof q?.answerIndex === "number"
        ? q!.answerIndex
        : (q as any)?.correctIndex;

    byIndex.set(i, {
      qIndex: i,
      prompt: text,
      options,
      answerIndex: typeof ans === "number" ? ans : -1,
      tags: Array.isArray(q?.tags) ? q.tags! : [],
    });
  });

  return {
    test,
    total: raw.length,
    byIndex,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method Not Allowed");

    const auth = requireUser(req);
    if (!auth) return bad(res, 401, "Unauthorized");
    const uid = auth.userId;

    let body: SubmitBody;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : ((req.body || {}) as any);
    } catch {
      return bad(res, 400, "Invalid JSON body");
    }

    // поддерживаем generatedTestId ИЛИ sessionId
    const generatedTestId = toNum((body as any).generatedTestId) ?? toNum((body as any).sessionId);
    if (generatedTestId == null) {
      return bad(res, 400, "Field 'generatedTestId' (or 'sessionId') must be a number");
    }

    if (!Array.isArray((body as any).answers) || (body as any).answers.length === 0) {
      return bad(res, 400, "Field 'answers' must be a non-empty array");
    }

    let answers: { qIndex: number; chosenIndex: number }[];
    try {
      answers = normalizeAnswers((body as any).answers);
    } catch (e: any) {
      return bad(res, 400, e?.message || "Invalid 'answers' format");
    }

    // Загружаем тест + вопросы из JSON (без TestQuestion)
    const loaded = await loadQuestionsFromJson(generatedTestId);
    if ("error" in loaded) return bad(res, 400, loaded.error || "Unknown error");

    const test = loaded.test as any;
    if (test.userId !== uid) return bad(res, 403, "Forbidden: test does not belong to user");

    const total = loaded.total;
    const byIndex = loaded.byIndex;

    // subjectId: из body или из самого теста
    const subjectIdRaw = (body as any).subjectId ?? test.subjectId ?? null;
    const subjectId = subjectIdRaw === null ? null : toNum(subjectIdRaw);
    if (subjectIdRaw !== null && subjectId == null) {
      return bad(res, 400, "Field 'subjectId' must be a number or null");
    }

    if (subjectId != null) {
      const subj = await prisma.subject.findFirst({
        where: { id: subjectId, userId: uid },
        select: { id: true },
      });
      if (!subj) return bad(res, 404, "Subject not found or not owned by current user");
      if (test.subjectId && test.subjectId !== subjectId) {
        return bad(res, 400, "Subject mismatch with GeneratedTest");
      }
    }

    // Подсчёт
    let correct = 0;

    // Формат, который ждёт фронт в SubmitResult.byQuestion
    const answersDetailed: {
      id: string;
      qIndex: number;
      chosenIndex: number;
      correctIndex: number;
      isCorrect: boolean;
      tags: string[];
    }[] = [];

    const byTag: Record<string, { total: number; correct: number; accuracy: number }> = {};

    for (const a of answers) {
      const q = byIndex.get(a.qIndex);
      if (!q) return bad(res, 400, `Answer references unknown question index ${a.qIndex}`);
      if (!Array.isArray(q.options) || q.options.length === 0) {
        return bad(res, 400, `Question ${a.qIndex} has no options`);
      }
      if (q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        return bad(res, 400, `Question ${a.qIndex} has invalid answerIndex`);
      }

      // chosenIndex === -1 -> не отвечено -> неверно
      let ok = false;
      if (a.chosenIndex >= 0) {
        if (a.chosenIndex >= q.options.length) {
          return bad(res, 400, `Chosen index out of range for question ${a.qIndex}`);
        }
        ok = a.chosenIndex === q.answerIndex;
      }
      if (ok) correct += 1;

      const tags = Array.isArray(q.tags) ? q.tags : [];

      answersDetailed.push({
        id: String(a.qIndex + 1), // простой стабильный id
        qIndex: a.qIndex,
        chosenIndex: a.chosenIndex,
        correctIndex: q.answerIndex, // фронт показывает это как "правильный"
        isCorrect: ok, // для зелёной/красной иконки
        tags,
      });

      for (const t of tags) {
        if (!byTag[t]) byTag[t] = { total: 0, correct: 0, accuracy: 0 };
        byTag[t].total += 1;
        if (ok) byTag[t].correct += 1;
      }
    }

    // accuracy как доля 0..1, scorePercent как 0..100
    const accuracy = total > 0 ? round1(correct / total) : 0;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // accuracy по тегам тоже доля 0..1
    for (const t of Object.keys(byTag)) {
      const v = byTag[t];
      v.accuracy = v.total ? round1(v.correct / v.total) : 0;
    }

    // Тайминги (опционально)
    const startedAt = (body as any).startedAt ? new Date((body as any).startedAt) : undefined;
    const completedAt = (body as any).completedAt ? new Date((body as any).completedAt) : undefined;
    const durationMsRaw = (body as any).durationMs;
    const durationMs = durationMsRaw == null ? undefined : toNum(durationMsRaw) ?? undefined;

    // Порог и passed
    const targetScore: number | null =
      typeof (test as any).targetScore === "number" ? (test as any).targetScore : null;

    const passed: boolean | null = targetScore != null ? scorePercent >= targetScore : null;

    // Сохраняем попытку
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: uid,
        generatedTestId,
        subjectId,

        topic: test.topic as string,
        difficulty: test.difficulty as DiffPrisma,
        mode: test.mode as ModePrisma,
        tagsVersion: test.tagsVersion as string,

        total,
        correct,
        accuracy, // доля 0..1
        byTag: byTag as any,
        byQuestion: answersDetailed as any,
        rawAnswers: answers as any,

        // Новый функционал порога
        ...(targetScore != null ? { targetScore } : {}),
        ...(passed !== null ? { passed } : {}),

        ...(durationMs != null ? { durationMs } : {}),
        ...(startedAt ? { startedAt } : {}),
        ...(completedAt ? { completedAt } : {}),
      },
      select: {
        id: true,
        accuracy: true,
        correct: true,
        total: true,
        byTag: true,
        targetScore: true,
        passed: true,
        byQuestion: true,
      },
    });

    // Агрегированная статистика по тегам (User + Subject + Tag)
    {
      const subjIdForStat = subjectId ?? null;

      for (const [tag, stat] of Object.entries(byTag)) {
        const totalDelta = stat.total;
        const correctDelta = stat.correct;

        // Пропускаем теги без вопросов
        if (!totalDelta) continue;

        const existing = await prisma.userTagStat.findUnique({
          where: {
            userId_subjectId_tag: {
              userId: uid,
              subjectId: subjIdForStat as number,
              tag,
            },
          },
        });

        if (!existing) {
          const baseTotal = totalDelta;
          const baseCorrect = correctDelta;
          const baseAccuracy = baseTotal > 0 ? round1(baseCorrect / baseTotal) : 0;

          await prisma.userTagStat.create({
            data: {
              userId: uid,
              subjectId: subjIdForStat as number,
              tag,
              total: baseTotal,
              correct: baseCorrect,
              accuracy: baseAccuracy,
            },
          });
        } else {
          const newTotal = existing.total + totalDelta;
          const newCorrect = existing.correct + correctDelta;
          const newAccuracy = newTotal > 0 ? round1(newCorrect / newTotal) : 0;

          await prisma.userTagStat.update({
            where: {
              userId_subjectId_tag: {
                userId: uid,
                subjectId: subjIdForStat as number,
                tag,
              },
            },
            data: {
              total: newTotal,
              correct: newCorrect,
              accuracy: newAccuracy,
            },
          });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      attemptId: attempt.id,
      accuracy: attempt.accuracy,
      correct: attempt.correct,
      total: attempt.total,
      byTag: attempt.byTag,
      byQuestion: attempt.byQuestion,
      targetScore: attempt.targetScore,
      passed: attempt.passed,
    });
  } catch (err: any) {
    const msg = err?.message || "Internal Server Error";
    return bad(res, 500, msg);
  }
}
