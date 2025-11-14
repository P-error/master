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
  // ==== Level of education (target audience) ====
  lv_basic: "Basic everyday knowledge; no formal education required",
  lv_schl1: "Lower/middle school level (early grades)",
  lv_schl2: "Upper/high school level",
  lv_bach: "Bachelor-level academic difficulty",
  lv_mast: "Master-level academic difficulty",
  lv_phd: "Doctoral/research-level difficulty",

  // ==== Tone ====
  tn_fri: "Friendly, encouraging tone",
  tn_neu: "Neutral, unemotional tone",
  tn_str: "Strict, demanding or formal tone",
  tn_bus: "Business-like, professional tone",

  // ==== Style ====
  st_acad: "Academic, textbook-like style",
  st_conv: "Conversational, informal style",
  st_narr: "Narrative or story-telling style",
  st_tech: "Technical style with formal definitions, formulas, or code",

  // ==== Format ====
  fmt_text: "Purely textual description",
  fmt_vis:
    "Text that strongly relies on imagined visual structures (graphs, diagrams, tables, layouts, etc.)",

  // ==== Depth of presentation (not difficulty) ====
  dp_shal: "Shallow, high-level overview without many details",
  dp_deep: "Detailed, with nuances and subtle points",

  // ==== Cognitive level ====
  cg_rc: "Recall: reproduce a fact, term, or definition",
  cg_ud: "Understand: explain, interpret, or summarize correctly",
  cg_ap: "Apply: use a concept, rule, or formula on a concrete example",
  cg_an: "Analyze: break down, identify causes/effects or internal structure",
  cg_cmp: "Compare: contrast multiple concepts, methods, or options",

  // ==== Task type ====
  tp_def: "Definition or terminology question",
  tp_proc: "Procedure/algorithm: steps, order of actions, or method",
  tp_ex: "Typical example or standard exercise",
  tp_case: "Case study or scenario from real or realistic life",
  tp_err: "Error spotting: find a mistake in reasoning, code, or formula",
  tp_cmp: "Comparison question between concepts or approaches",

  // ==== Micro-difficulty / structure ====
  diff_ms: "Multi-step: requires several logical steps to solve",
  diff_tr: "Tricky: contains a subtle trap or misleading hint",
  diff_ab: "Abstract: no concrete examples, purely theoretical",
  diff_lg: "Long: lengthy statement with a lot of text or conditions",

  // ==== Domain ====
  dom_stem: "STEM: natural sciences, math, engineering, or CS",
  dom_hum: "Humanities or social sciences",
  dom_art: "Artistic or creative domain",
  dom_mix: "Mixed or interdisciplinary domain",

  // ==== Context ====
  ctx_abs: "Abstract context, not tied to any real-life situation",
  ctx_rw: "Real-world context: everyday life, industry, or society",
  ctx_acad: "Academic/educational context: exams, courses, university",
  ctx_story: "Story/plot context: narrative or fictional scenario",
};

const TAG_LEGEND_TEXT = Object.entries(TAG_LEGEND_V1)
  .map(([code, desc]) => `- ${code}: ${desc}`)
  .join("\n");

const TAG_AXES_DESCRIPTION = `
Tags are grouped by axes using prefixes:

- lv_* : level of education (lv_basic, lv_schl1, lv_schl2, lv_bach, lv_mast, lv_phd)
- tn_* : tone (tn_fri, tn_neu, tn_str, tn_bus)
- st_* : style (st_acad, st_conv, st_narr, st_tech)
- fmt_*: format (fmt_text, fmt_vis)
- dp_* : depth (dp_shal, dp_deep)
- cg_* : cognitive level (cg_rc, cg_ud, cg_ap, cg_an, cg_cmp)
- tp_* : task type (tp_def, tp_proc, tp_ex, tp_case, tp_err, tp_cmp)
- diff_*: micro-difficulty/structure (diff_ms, diff_tr, diff_ab, diff_lg)
- dom_* : domain (dom_stem, dom_hum, dom_art, dom_mix)
- ctx_* : context (ctx_abs, ctx_rw, ctx_acad, ctx_story)
`;

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

// --- НОВОЕ: инструкции по режимам ---
function buildModeInstructions(mode: ModePrisma, comfyTags: string[]): string {
  if (mode === "ACADEMIC") {
    return `
ACADEMIC MODE:
- Prefer academic style (st_acad) and strict or neutral tone (tn_str or tn_neu).
- For each question, you SHOULD include st_acad and tn_str, unless the topic makes strict tone clearly inappropriate.
- Other tags are free, but must follow the axis rules (at most one tag per prefix group).`;
  }

  if (mode === "COMFORT") {
    const comfyList =
      comfyTags.length > 0
        ? comfyTags.map((t) => `- ${t}`).join("\n")
        : "(no strong preferences available yet)";

    return `
COMFORT MODE:
- User has higher accuracy with the following tags (across different axes):
${comfyList}

- When choosing tags (tone, style, context, task types, etc.) you should, where possible, prefer tags from this list.
- Still, each question must have 5–7 tags and follow the "one tag per axis" rule.
- Do NOT force all tags to be from this list; diversity is allowed, but bias towards the user's stronger tags.`;
  }

  // RANDOM
  return `
RANDOM MODE:
- You are free to combine tags from all axes in a diverse way.
- For each question, choose 5–7 tags, one per axis at most.
- Try to vary tone, style, context, task types, and micro-difficulty between questions.`;
}

function normalizeOne(q: RawQuestion, i: number): StoredQuestion {
  const idRaw = q?.id ?? q?.qid ?? i + 1;
  const id = String(idRaw);
  const question = (q?.question ?? q?.text ?? "").trim() || `Question ${i + 1}`;
  const opts = q?.options ?? q?.answers;
  const options = Array.isArray(opts)
    ? opts.filter((s) => typeof s === "string")
    : undefined;
  const ai =
    typeof q?.answerIndex === "number"
      ? q.answerIndex
      : typeof q?.correctIndex === "number"
      ? q.correctIndex
      : undefined;

  // фильтруем теги по нашему словарю и обрезаем до 7
  const rawTags = Array.isArray(q?.tags)
    ? q.tags.filter((s) => typeof s === "string")
    : [];
  const tagsFiltered = rawTags.filter((code) => code in TAG_LEGEND_V1);
  const limitedTags = tagsFiltered.slice(0, 7);

  const base: StoredQuestion = { id, question };
  if (options && options.length > 0) base.options = options;
  if (typeof ai === "number") base.answerIndex = ai;
  if (limitedTags.length > 0) base.tags = limitedTags;
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
      // простые дефолтные теги из новой легенды
      tags: ["lv_schl2", "tn_neu", "st_acad", "cg_ud", "tp_ex"],
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
    modeInstructions: string;
  }
): Promise<StoredQuestion[]> {
  const { topic, difficulty, count, mode, refinements, modeInstructions } = params;

  const sys = `You are a test generator for an educational platform.

Tag legend:
${TAG_LEGEND_TEXT}

${TAG_AXES_DESCRIPTION}

Mode instructions:
${modeInstructions}

You MUST:
- Output ONLY a valid JSON array of question objects, no extra text.
- Follow the JSON schema provided in the user message.
- For each question you MUST assign 5–7 tags from the legend.

Tag rules per question:
- Use at most one tag per axis (at most one lv_*, one tn_*, one st_*, etc. per question).
- Prefer meaningful tags; do not invent new codes.
- Always include at least:
  - one lv_* tag,
  - one tn_* tag,
  - one st_* tag,
  - one or two cg_* tags,
  - one tp_* tag.

No prose, no markdown fences, no explanations — only the JSON array of questions.`;

  const user = {
    instruction:
      "Generate multiple-choice questions for students. Use the tagLegend to assign tags to each question.",
    topic,
    difficulty,
    mode,
    count,
    refinements,
    // словарь допустимых тегов, которые можно использовать в поле 'tags'
    tagLegend: TAG_LEGEND_V1,
    // схема ожидаемых объектов вопроса
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
  const norm = parsed
    .map((q: RawQuestion, i: number) => normalizeOne(q, i))
    .filter(Boolean);
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

    // --- НОВОЕ: comfyTags из UserTagStat для COMFORT ---
    let comfyTags: string[] = [];
    if (modePrisma === "COMFORT") {
      const tagStats = await prisma.userTagStat.findMany({
        where: {
          userId: auth.userId,
          ...(subjectId ? { subjectId } : {}),
        },
        select: {
          tag: true,
          total: true,
          correct: true,
          accuracy: true,
        },
      });

      const MIN_TOTAL = 3;
      const MIN_ACC = 0.75;

      const good = tagStats
        .map((t) => ({
          tag: t.tag,
          total: t.total,
          accuracy:
            typeof t.accuracy === "number"
              ? t.accuracy
              : t.total > 0
              ? t.correct / t.total
              : 0,
        }))
        .filter((t) => t.total >= MIN_TOTAL && t.accuracy >= MIN_ACC);

      comfyTags = good.map((t) => t.tag);
    }

    const modeInstructions = buildModeInstructions(modePrisma, comfyTags);

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
          modeInstructions,
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
        plannedTagsPerQuestion,
        questions,
        experimentArm: null,
        tagStrategy:
          modePrisma === "COMFORT" && comfyTags.length
            ? `mode=${modePrisma}; comfyTags=${comfyTags.join(",")}`
            : `mode=${modePrisma}`,
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
