// src/pages/api/generate-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

type DiffLower = "easy" | "medium" | "hard";
type DiffPrisma = "EASY" | "MEDIUM" | "HARD";
type ModeLower = "academic" | "comfort" | "random";
type ModePrisma = "ACADEMIC" | "COMFORT" | "RANDOM";

const TAG_LEGEND_V1: Record<string, string> = {
  ac: "Academic, formal/rigorous style; close to exam wording",
  fr: "Friendly, conversational style; simpler wording",
  rw: "Real-world examples and applications",
  ch: "Challenging or tricky question that requires deeper reasoning",
};

type Body = {
  subject?: string;
  subjectId?: number;
  topic?: string;
  difficulty?: string;
  mode?: string;
  count?: number;
  goal?: number;
  refinements?: string[];
  tagsVersion?: string;
};

type RawQuestion = {
  id?: string | number;
  qid?: string | number;
  question?: string;
  text?: string;
  options?: string[];
  answers?: string[];
  answerIndex?: number;
  correctIndex?: number;
  tags?: string[];
  [k: string]: any;
};

type StoredQuestion = {
  id: string;
  question: string;
  options?: string[];
  answerIndex?: number;
  tags?: string[];
};

const DEBUG = process.env.DEBUG_GEN === "1";

function log(...args: any[]) {
  if (DEBUG) console.log("[GEN]", ...args);
}

function bad(res: NextApiResponse, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

function toDiffLower(d: any): DiffLower {
  const v = String(d ?? "").toUpperCase();
  if (v === "EASY") return "easy";
  if (v === "HARD") return "hard";
  return "medium";
}
function toDiffPrisma(d: any): DiffPrisma {
  const v = String(d ?? "").toUpperCase();
  if (v === "EASY" || v === "MEDIUM" || v === "HARD") return v as DiffPrisma;
  if (v === "easy") return "EASY";
  if (v === "hard") return "HARD";
  return "MEDIUM";
}
function toModeLower(m: any): ModeLower {
  const v = String(m ?? "").toUpperCase();
  if (v === "COMFORT") return "comfort";
  if (v === "RANDOM") return "random";
  return "academic";
}
function toModePrisma(m: any): ModePrisma {
  const v = String(m ?? "").toUpperCase();
  if (v === "COMFORT" || v === "RANDOM" || v === "ACADEMIC") return v as ModePrisma;
  if (v === "comfort") return "COMFORT";
  if (v === "random") return "RANDOM";
  return "ACADEMIC";
}

function normalizeOne(q: RawQuestion, i: number): StoredQuestion {
  const idRaw = q?.id ?? q?.qid ?? i + 1;
  const id = String(idRaw);
  const question = (q?.question ?? q?.text ?? "").trim() || `Question ${i + 1}`;
  const opts = q?.options ?? q?.answers;
  const options = Array.isArray(opts) ? opts.filter((s) => typeof s === "string") : undefined;
  const ai =
    typeof q?.answerIndex === "number"
      ? q.answerIndex
      : typeof q?.correctIndex === "number"
      ? q.correctIndex
      : undefined;
  const tags = Array.isArray(q?.tags) ? q.tags.filter((s) => typeof s === "string") : undefined;

  const base: StoredQuestion = { id, question };
  if (options && options.length > 0) base.options = options;
  if (typeof ai === "number") base.answerIndex = ai;
  if (tags && tags.length > 0) base.tags = tags;
  return base;
}

function makeFallbackQuestions(topic: string, count: number): StoredQuestion[] {
  const c = Math.min(Math.max(count || 5, 1), 20);
  const t = topic || "Общая тема";
  const list: StoredQuestion[] = [];
  for (let i = 0; i < c; i++) {
    list.push({
      id: String(i + 1),
      question: `(${t}) Вопрос ${i + 1}: выбери верный вариант`,
      options: ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
      answerIndex: 0,
      tags: ["ac"],
    });
  }
  return list;
}

async function generateViaOpenAI(
  openai: OpenAI,
  params: {
    topic: string;
    difficulty: DiffLower;
    count: number;
    mode: ModeLower;
    refinements: string[];
  }
): Promise<StoredQuestion[]> {
  const { topic, difficulty, count, mode, refinements } = params;

  const sys = `You are a test generator for an educational platform.

You MUST:
- Output ONLY a valid JSON array of question objects, no extra text.
- Follow the JSON schema provided in the user message.
- For each question, include a "tags" field: an array of short tag codes.
- Use ONLY tag codes that exist as keys in the "tagLegend" object from the user message.
- Do NOT invent new tag codes.

No prose, no markdown fences, no explanations — only the JSON array of questions.`;

const user = {
  instruction:
    "Generate multiple-choice questions for students. Use the tagLegend to assign tags to each question.",
  topic,
  difficulty,
  mode,
  count,
  refinements,
  // Жёсткий словарь допустимых тегов, которые можно использовать в поле 'tags'
  tagLegend: TAG_LEGEND_V1,
  // Схема ожидаемых объектов вопроса
  schema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: ["string", "number"] },
        question: { type: "string" },
        options: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 8,
        },
        answerIndex: { type: "number" },
        tags: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["question", "options", "answerIndex"],
      additionalProperties: true,
    },
    minItems: 1,
    maxItems: 50,
  },
};

  log("OPENAI model:", process.env.OPENAI_MODEL || "gpt-4o-mini");
  log("Prompt topic:", topic, "difficulty:", difficulty, "count:", count, "mode:", mode);

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) },
    ],
    temperature: 0.2,
  });

  const content = resp.choices?.[0]?.message?.content?.trim() ?? "";
  log("Raw content length:", content.length);
  if (content) log("Raw content (head):", content.slice(0, 240));

  let parsed: any;
  try {
    const jsonText = content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
    parsed = JSON.parse(jsonText);
  } catch (e: any) {
    log("JSON parse error:", e?.message);
    return [];
  }

  if (!Array.isArray(parsed)) {
    log("Parsed is not an array, type:", typeof parsed);
    return [];
  }
  const norm = parsed.map((q: RawQuestion, i: number) => normalizeOne(q, i)).filter(Boolean);
  log("Normalized count:", norm.length);
  return norm;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return bad(res, 401, "Требуется авторизация");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return bad(res, 405, "Метод не поддерживается");
  }

  try {
    const {
      subject,
      subjectId,
      topic,
      difficulty,
      mode,
      count,
      goal,
      refinements,
      tagsVersion,
    } = (req.body ?? {}) as Body;

    const openaiKey = process.env.OPENAI_API_KEY || "";
    const openai = new OpenAI({ apiKey: openaiKey });

    const difficultyLower = toDiffLower(difficulty ?? "medium");
    const difficultyPrisma = toDiffPrisma(difficulty ?? "MEDIUM");
    const modeLower = toModeLower(mode ?? "academic");
    const modePrisma = toModePrisma(mode ?? "ACADEMIC");

    const numQuestions = Math.min(Math.max(Number(count ?? 5), 1), 20);
    const topicStr = (topic ?? subject ?? "").trim();
    const refinementsArr = Array.isArray(refinements) ? refinements : [];
    const tagsVer = (tagsVersion ?? "v1").trim() || "v1";
    const g = Number(goal);
    const targetScore = Number.isFinite(g)
      ? Math.min(Math.max(Math.round(g), 0), 100)
      : null;


    log("ENV OPENAI_API_KEY?", !!openaiKey, "numQuestions:", numQuestions);

    let questions: StoredQuestion[] = [];

    if (openaiKey) {
      try {
        questions = await generateViaOpenAI(openai, {
          topic: topicStr || "Общая тема",
          difficulty: difficultyLower,
          count: numQuestions,
          mode: modeLower,
          refinements: refinementsArr,
        });
      } catch (e: any) {
        log("OpenAI call failed:", e?.message);
      }
    } else {
      log("No OPENAI_API_KEY present, skipping OpenAI call.");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      log("Using fallback questions");
      questions = makeFallbackQuestions(topicStr, numQuestions);
    }

    const plannedTagsPerQuestion: string[][] = questions.map((q) => q.tags ?? []);

    const created = await prisma.generatedTest.create({
      data: {
        userId: auth.userId,
        subjectId: subjectId ?? null,
        topic: topicStr || (subjectId ? "subject-session" : "custom-topic"),
        difficulty: difficultyPrisma,
        mode: modePrisma,
        savable: true,
        tagsVersion: tagsVer,
        refinements: refinementsArr,
        numQuestions,
        targetScore: targetScore ?? 80,
        numOptions: questions[0]?.options?.length ?? 4,
        prefSnapshot: null,
        plannedTagsPerQuestion,
        questions,
        experimentArm: null,
        tagStrategy: null,
      },
      select: { id: true },
    });

    console.log(
      "[/api/generate-test] created session:",
      created.id,
      "questions:",
      questions.length
    );
    return res.status(200).json({ ok: true, sessionId: String(created.id) });
  } catch (err: any) {
    console.error("[/api/generate-test] error:", err);
    return bad(res, 500, err?.message || "Internal error");
  }
}
