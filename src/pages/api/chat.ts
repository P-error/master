// src/pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import OpenAI from "openai";
import { loadUserPrefs, buildPersonalizationSystemPrompt } from "@/lib/personalization";

type LiteMsg = { role: "user" | "assistant"; content: string };

function toOpenAIChat(messages: { role: string; content: string }[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

function parseBool(v: any, def = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  return def;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  try {
    if (req.method === "GET") {
      // История чата пользователя (совместимо с фронтом, который дёргает /api/chat как первый вариант)
      const limit = Math.min(
        200,
        Math.max(1, Number(req.query.limit ?? 50) || 50)
      );
      const order = (String(req.query.order || "asc").toLowerCase() === "desc"
        ? "desc"
        : "asc") as "asc" | "desc";

      const rows = await prisma.chatMessage.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: order },
        take: limit,
      });

      const messages = rows.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));

      return res.status(200).json({ messages });
    }

    if (req.method === "POST") {
      /**
       * Совместим несколько вариантов тела запроса:
       * - { content: string, withHistory?: boolean }
       * - { message: string, withHistory?: boolean }
       * - { history?: LiteMsg[], content?: string }  // если фронт присылает свою историю
       */
      const body = (req.body ?? {}) as {
        content?: string;
        message?: string;
        withHistory?: boolean | string;
        history?: LiteMsg[];
      };

      const text = (body.content ?? body.message ?? "").trim();
      if (!text) {
        return res.status(400).json({ error: "Empty message content" });
      }

      const withHistory = parseBool(body.withHistory, true);

      // 1) Сохраняем пользовательское сообщение в БД
      const userMsg = await prisma.chatMessage.create({
        data: { userId: auth.userId, role: "user", content: text },
      });

      // 2) Загружаем предпочтения пользователя и строим персонализирующий system-промпт
      const prefs = await loadUserPrefs(auth.userId);
      const systemPersona = buildPersonalizationSystemPrompt(prefs);

      // 3) История: либо из БД (если withHistory=true), либо из тела запроса (если прислали)
      let history: LiteMsg[] = [];
      if (Array.isArray(body.history) && body.history.length > 0) {
        history = toOpenAIChat(body.history);
      } else if (withHistory) {
        const lastMessages = await prisma.chatMessage.findMany({
          where: { userId: auth.userId },
          orderBy: { createdAt: "asc" },
          take: 50, // при желании уменьшите до 12–16
        });
        history = toOpenAIChat(
          lastMessages.map((m) => ({ role: m.role, content: m.content }))
        );
      }

      // 4) Вызываем OpenAI
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPersona }, ...history],
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
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Chat failed" });
  }
}
