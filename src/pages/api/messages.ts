// Тонкий прокси под старый/альтернативный путь фронта.
// POST /api/messages -> делает то же, что POST /api/chat/messages
import type { NextApiRequest, NextApiResponse } from "next";
import messagesHandler from "./chat/messages";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // Довернём в общий обработчик
  return messagesHandler(req, res);
}
