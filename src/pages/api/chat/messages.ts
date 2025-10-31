import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import OpenAI from "openai";
import { loadUserPrefs, buildPersonalizationSystemPrompt } from "@/lib/personalization";

function toOpenAIChat(messages: { role: string; content: string }[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    try {
      const rows = await prisma.chatMessage.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      const messages = rows.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));

      return res.status(200).json({ messages });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to load messages" });
    }
  }

  if (req.method === "POST") {
    try {
      const { content } = req.body as { content?: string };
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Empty message content" });
      }

      // 1) Сохраняем пользовательское сообщение
      const userMsg = await prisma.chatMessage.create({
        data: { userId: auth.userId, role: "user", content: content.trim() },
      });

      // 2) Загружаем предпочтения и формируем скрытый персонализирующий system-промпт
      const prefs = await loadUserPrefs(auth.userId);
      const systemPersona = buildPersonalizationSystemPrompt(prefs);

      // 3) Собираем историю (можно сократить до 12–16 при желании)
      const lastMessages = await prisma.chatMessage.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      const history = toOpenAIChat(
        lastMessages.map((m) => ({ role: m.role, content: m.content }))
      );

      // 4) Генерируем ответ ассистента
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPersona },
          ...history,
        ],
        temperature: 0.3,
      });

      const assistantText =
        completion.choices?.[0]?.message?.content?.trim() || "…";

      // 5) Сохраняем ответ ассистента
      const assistantMsg = await prisma.chatMessage.create({
        data: { userId: auth.userId, role: "assistant", content: assistantText },
      });

      return res.status(200).json({
        message: {
          role: assistantMsg.role,
          content: assistantMsg.content,
          createdAt: assistantMsg.createdAt.toISOString(),
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to send message" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
