import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { login, subjectId, topic, difficulty, questions, answers } = req.body;

  if (!login || !questions || !answers) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // 1. Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({ where: { login: String(login) } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Подсчёт очков (количество правильных ответов)
    let score = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] && answers[i] === q.correct) {
        score++;
      }
    });

    // 3. Сохраняем тест
    const test = await prisma.test.create({
      data: {
        topic: topic || "Custom Test",
        difficulty: difficulty || "medium",
        numQuestions: questions.length,
        numOptions: questions[0]?.options?.length || 4,
        score,
        questions,
        userId: user.id,
        subjectId: subjectId ? Number(subjectId) : null,
      },
    });

    // 4. Возвращаем результат клиенту
    res.status(200).json({
      message: "Test submitted successfully",
      test,
      accuracy: Math.round((score / questions.length) * 100),
    });
  } catch (err) {
    console.error("Submit test error:", err);
    res.status(500).json({ error: "Failed to submit test" });
  }
}
