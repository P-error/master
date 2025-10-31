// src/pages/api/tests/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import generateHandler from "../generate-test";

// Проксируем POST /api/tests → ту же логику, что и /api/generate-test
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // просто делегируем в генератор
    // (Next позволяет вызывать хендлер как обычную функцию)
    return generateHandler(req, res);
  }

  // Если нужно — тут можно повесить GET /api/tests → список прошлых тестов
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Метод не поддерживается" });
}
