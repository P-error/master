import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type GenerateBody = {
  subjectId?: number;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  numQuestions?: number;
  tags?: string[]; // опционально: явно подсказать теги (например ["probability","bayes"])
  model?: string;
};

export type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number; // 0..n-1
  tags: string[]; // тематические метки
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  subjectId: number;
};

export type GeneratedTest = {
  subjectId: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: TestQuestion[];
};

function bad(res: NextApiResponse, msg: string, code = 400) {
  return res.status(code).json({ error: msg });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method not allowed", 405);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return bad(res, "OPENAI_API_KEY is not set", 500);

  let body: GenerateBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return bad(res, "Invalid JSON body");
  }

  const subjectId = Number(body.subjectId);
  const topic = (body.topic || "").trim();
  const difficulty = (body.difficulty || "medium") as "easy" | "medium" | "hard";
  const numQuestions = Math.min(Math.max(Number(body.numQuestions || 10), 1), 50);
  const inputTags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];
  const model = body.model || "gpt-4o-mini";

  if (!subjectId || !Number.isFinite(subjectId)) return bad(res, "subjectId must be a number");
  if (!topic) return bad(res, "topic is required");
  if (!["easy", "medium", "hard"].includes(difficulty)) return bad(res, "difficulty must be easy|medium|hard");

  // Подготовим системный промпт, чтобы гарантировать строгий формат JSON
  const system = `You are a test generator. Return ONLY valid JSON. 
Each question must be multiple-choice with 4 options, include a correct "answerIndex" (0..3), and a non-empty "tags" array.
Use the following JSON schema, no extra fields:

{
  "questions": [
    {
      "id": "string-uuid-or-stable-id",
      "question": "string",
      "options": ["string","string","string","string"],
      "answerIndex": 0,
      "tags": ["tag1","tag2"]
    }
  ]
}`;

  const user = `Generate ${numQuestions} questions for subjectId=${subjectId}, topic="${topic}", difficulty="${difficulty}".
If tags were provided, bias the questions to cover them: [${inputTags.join(", ")}].
Ensure tags on each question are granular (e.g., "probability", "bayes", "linear-regression", "regularization").`;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.toString() || "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Попробуем выдрать JSON из текста (редкий случай)
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(raw.slice(start, end + 1));
      } else {
        return bad(res, "Model did not return valid JSON", 500);
      }
    }

    const arr = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (!arr.length) return bad(res, "No questions generated", 500);

    // Нормализуем вопросы и добавим метаданные
    const questions: TestQuestion[] = arr.slice(0, numQuestions).map((q: any, i: number) => {
      const id = String(q?.id || `q_${i + 1}`);
      const question = String(q?.question || "").trim();
      const options = Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : [];
      const answerIndex = Number(q?.answerIndex);
      const tags = Array.isArray(q?.tags) ? q.tags.map((t: any) => String(t)) : [];

      if (!question || options.length !== 4 || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        throw new Error(`Invalid question at index ${i}`);
      }

      const mergedTags = Array.from(new Set([...(inputTags || []), ...tags])).slice(0, 6);

      return {
        id,
        question,
        options,
        answerIndex,
        tags: mergedTags,
        difficulty,
        topic,
        subjectId,
      };
    });

    const payload: GeneratedTest = {
      subjectId,
      topic,
      difficulty,
      questions,
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("generate-test error:", err?.response?.data || err?.message || err);
    return bad(res, "Failed to generate test", 500);
  }
}
