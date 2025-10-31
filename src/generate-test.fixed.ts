// src/pages/api/generate-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/auth";
import OpenAI from "openai";

import { prisma } from "@/lib/prisma";
type DiffLower = "easy" | "medium" | "hard";
type DiffPrisma = "EASY" | "MEDIUM" | "HARD";
type ModeLower = "academic" | "comfort" | "random";
type ModePrisma = "ACADEMIC" | "COMFORT" | "RANDOM";

type Body = {
  subject?: string;
  subjectId?: number;
  topic?: string;
  difficulty?: string;
  mode?: string;
  numQuestions?: number;
  count?: number;
  numOptions?: number;
  tags?: string[] | string;
  model?: string;
  refinements?: string[];
};

type GenQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  tags: string[];
};

type GenResponse =
  | {
      sessionId: number;
      id: number;
      subjectId?: number;
      createdSubject?: { id: number; name?: string; title?: string } | null;
      savable: boolean;
      topic: string;
      difficulty: DiffLower;
      mode: ModeLower;
      refinements: string[];
      questions: (GenQuestion & { difficulty: DiffLower; topic: string; subjectId?: number })[];
    }
  | { error: string };

function bad(res: NextApiResponse, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

function mapDifficultyAny(input: any): { lower: DiffLower; prisma: DiffPrisma } {
  const v = String(input ?? "").trim();
  const up = v.toUpperCase();
  if (up === "EASY") return { lower: "easy", prisma: "EASY" };
  if (up === "MEDIUM") return { lower: "medium", prisma: "MEDIUM" };
  if (up === "HARD") return { lower: "hard", prisma: "HARD" };
  const low = v.toLowerCase();
  if (low === "easy") return { lower: "easy", prisma: "EASY" };
  if (low === "medium") return { lower: "medium", prisma: "MEDIUM" };
  if (low === "hard") return { lower: "hard", prisma: "HARD" };
  return { lower: "medium", prisma: "MEDIUM" };
}
function mapModeAny(input: any): { lower: ModeLower; prisma: ModePrisma } {
  const v = String(input ?? "").trim();
  const up = v.toUpperCase();
  if (up === "ACADEMIC") return { lower: "academic", prisma: "ACADEMIC" };
  if (up === "COMFORT") return { lower: "comfort", prisma: "COMFORT" };
  if (up === "RANDOM") return { lower: "random", prisma: "RANDOM" };
  const low = v.toLowerCase();
  if (low === "academic") return { lower: "academic", prisma: "ACADEMIC" };
  if (low === "comfort") return { lower: "comfort", prisma: "COMFORT" };
  if (low === "random") return { lower: "random", prisma: "RANDOM" };
  return { lower: "academic", prisma: "ACADEMIC" };
}

function normalizeTags(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map((s) => String(s ?? "").trim()).filter(Boolean);
  return String(x ?? "")
    .split(/[,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GenResponse>) {
  if (req.method !== "POST") return bad(res, 405, "Method Not Allowed");

  const auth = await requireUser(req, res);
  if (!auth?.userId) return bad(res, 401, "Unauthorized");

  try {
    const body: Body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    let {
      subject,
      subjectId,
      topic,
      difficulty = "MEDIUM",
      refinements = [],
      numQuestions = 5,
      count,
      numOptions = 4,
      mode = "academic",
      tags = [],
      model,
    } = body;

    if (!numQuestions && typeof count === "number") numQuestions = count;

    const { lower: difficultyLower, prisma: difficultyPrisma } = mapDifficultyAny(difficulty);
    const { lower: modeLower, prisma: modePrisma } = mapModeAny(mode);

    const title = String(subject ?? "").trim();
    let topicStr = String(((topic ?? title) || "Без темы")).trim();

    const tagsArr = normalizeTags(tags);
    const plannedTagsPerQuestion: string[][] =
      tagsArr.length > 0
        ? Array.from({ length: numQuestions }, () => tagsArr)
        : Array.from({ length: numQuestions }, () => ["ac"]);

    const savable = Boolean(title || subjectId);
    let subjectRec: { id: number; name: string } | null = null;
    let createdSubject: { id: number; name: string } | null = null;

    if (savable) {
      if (subjectId) {
        const found = await prisma.subject.findUnique({
          where: { id: Number(subjectId) },
          select: { id: true, name: true },
        });
        if (found) subjectRec = found;
      }
      if (!subjectRec && title) {
        const sameByName = await prisma.subject.findFirst({
          where: { name: { equals: title, mode: "insensitive" } },
          select: { id: true, name: true },
        });
        if (sameByName) subjectRec = sameByName;
      }
      if (!subjectRec && title) {
        createdSubject = await prisma.subject.create({
          data: { name: title },
          select: { id: true, name: true },
        });
        subjectRec = createdSubject;
      }
    }

    if ((!topic || !topic.trim()) && (!title || !title.trim()) && subjectRec?.name) {
      topicStr = subjectRec.name.trim();
    }

    const system = `Ты помощник-преподаватель. Генерируй тест из ${numQuestions} вопросов по теме "${topicStr}".
Сложность: ${difficultyLower}. Режим: ${modeLower}.
Каждый вопрос должен иметь ${numOptions} вариантов ответов.
Постарайся учитывать план тегов: ${JSON.stringify(plannedTagsPerQuestion)}.`;

    const userPrompt = `Нужен JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "…",
      "options": ["…", "…", "…", "…"],
      "answerIndex": 0,
      "tags": ["ac"]
    }
  ]
}
Внимание: верни ТОЛЬКО JSON без любых пояснений.`;

    let questions: (GenQuestion & { difficulty: DiffLower; topic: string; subjectId?: number })[] = [];

    if (process.env.USE_MOCK_QUESTIONS === "true") {
      questions = Array.from({ length: numQuestions }, (_, i) => {
        const opts = Array.from({ length: numOptions }, (_, j) => `Вариант ${j + 1}`);
        const correct = Math.floor(Math.random() * numOptions);
        return {
          id: `q_${Date.now()}_${i}`,
          question: `Вопрос №${i + 1} по теме «${topicStr}»`,
          options: opts,
          answerIndex: correct,
          tags: plannedTagsPerQuestion[i],
          difficulty: difficultyLower,
          topic: topicStr,
          subjectId: savable ? subjectRec?.id : undefined,
        };
      });
    } else {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        temperature: 0.4,
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        return bad(res, 500, "Ответ модели не JSON");
      }
      if (!Array.isArray(parsed.questions)) {
        return bad(res, 500, "Модель не вернула массив questions");
      }

      questions = parsed.questions.slice(0, numQuestions).map((q: any, i: number) => {
        const opts = Array.isArray(q.options)
          ? q.options.slice(0, numOptions).map((s: any) => String(s ?? ""))
          : [];
        const ai = Number(q.answerIndex);
        const answerIndex = Number.isFinite(ai) ? Math.max(0, Math.min(opts.length - 1, ai)) : 0;
        const id = String(q.id ?? `q_${Date.now()}_${i}`);
        const tagsQ = normalizeTags(q.tags ?? plannedTagsPerQuestion[i] ?? ["ac"]);
        return {
          id,
          question: String(q.question ?? `Вопрос №${i + 1}`),
          options: opts.length ? opts : Array.from({ length: numOptions }, (_, j) => `Вариант ${j + 1}`),
          answerIndex,
          tags: tagsQ,
          difficulty: difficultyLower,
          topic: topicStr,
          subjectId: savable ? subjectRec?.id : undefined,
        };
      });
    }

    const createdSession = await prisma.generatedTest.create({
      data: {
        user: { connect: { id: auth.userId } },        // relation — обязательно
        subjectId: subjectRec?.id ?? null,
        topic: topicStr,
        difficulty: difficultyPrisma,
        mode: modePrisma,
        tagsVersion: null,
        plannedTagsPerQuestion,
        questions,                                      // JSON с полными вопросами
topic, subjectId, ...rest }) => rest),
        numQuestions,
        numOptions,
      },
      select: { id: true },
    });

    return res.status(200).json({
      sessionId: createdSession.id,
      id: createdSession.id,
      subjectId: subjectRec?.id,
      createdSubject,
      savable,
      topic: topicStr,
      difficulty: difficultyLower,
      mode: modeLower,
      refinements: Array.isArray(refinements) ? refinements : [],
      questions,
    });
  } catch (err: any) {
    console.error("[/api/generate-test] error:", err);
    if (String(err?.message || "").includes("OPENAI_API_KEY")) {
      return bad(res, 500, "Нет OPENAI_API_KEY");
    }
    return bad(res, 500, err?.message || "Internal error");
  }
}
