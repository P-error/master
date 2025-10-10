import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";
import OpenAI from "openai";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded: any = verify(token, process.env.JWT_SECRET || "dev_secret");
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { message, withHistory } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Загружаем профиль
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Загружаем историю сообщений (если нужно)
  let history: any[] = [];
  if (withHistory) {
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    history = messages.reverse().map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
  }

  // Формируем скрытый подзапрос
  const hiddenPrompt = `
Ты персональный ассистент. Используй такие параметры:
- Образование: ${user.educationLevel}
- Цель: ${user.learningGoal}
- Стиль: ${user.learningStyle}
- Формат: ${user.preferredFormat}
- Тон: ${user.preferredTone}
- Детализация: ${user.detailLevel}
- Предыдущие знания: ${user.priorKnowledge}
- Уровень языка: ${user.languageLevel}
`;

  const messages = [
    { role: "system", content: hiddenPrompt },
    ...history,
    { role: "user", content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Сохраняем в историю
    await prisma.chatMessage.createMany({
      data: [
        { userId, role: "user", content: message },
        { userId, role: "assistant", content: responseText },
      ],
    });

    res.status(200).json({ response: responseText });
  } catch (err: any) {
    console.error("Chat API error:", err);
    res.status(500).json({ error: err.message || "Chat failed" });
  }
}
