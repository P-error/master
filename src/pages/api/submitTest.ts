import type { NextApiRequest, NextApiResponse } from "next";

type TestQuestion = any;

type SubmitBody = {
  subjectId: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: TestQuestion[];
  answers: number[]; // индексы 0..3 по порядку questions
};

export type TestResult = {
  total: number;
  correct: number;
  accuracy: number; // 0..1
  byTag: { [tag: string]: { total: number; correct: number; accuracy: number } };
  byQuestion: { id: string; correct: boolean; expected: number; got: number }[];
};

function bad(res: NextApiResponse, msg: string, code = 400) {
  return res.status(code).json({ error: msg });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method not allowed", 405);

  let body: SubmitBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return bad(res, "Invalid JSON");
  }

  const { subjectId, topic, difficulty, questions, answers } = body || {};
  if (!subjectId || !topic || !difficulty) return bad(res, "Missing subjectId/topic/difficulty");
  if (!Array.isArray(questions) || !questions.length) return bad(res, "questions required");
  if (!Array.isArray(answers) || answers.length !== questions.length) return bad(res, "answers length must equal questions length");

  let correct = 0;
  const byTag: Record<string, { total: number; correct: number }> = {};
  const byQuestion: TestResult["byQuestion"] = [];

  questions.forEach((q, i) => {
    const user = Number(answers[i]);
    const ok = user === q.answerIndex;
    if (ok) correct++;
    byQuestion.push({ id: q.id, correct: ok, expected: q.answerIndex, got: user });

    (q.tags || []).forEach((t: any) => {
      const tag = String(t);
      if (!byTag[tag]) byTag[tag] = { total: 0, correct: 0 };
      byTag[tag].total += 1;
      if (ok) byTag[tag].correct += 1;
    });
  });

  const total = questions.length;
  const accuracy = total ? correct / total : 0;
  const byTagAcc: TestResult["byTag"] = {};
  for (const [tag, v] of Object.entries(byTag)) {
    byTagAcc[tag] = {
      total: v.total,
      correct: v.correct,
      accuracy: v.total ? v.correct / v.total : 0,
    };
  }

  const result: TestResult = {
    total,
    correct,
    accuracy,
    byTag: byTagAcc,
    byQuestion,
  };

  return res.status(200).json(result);
}
