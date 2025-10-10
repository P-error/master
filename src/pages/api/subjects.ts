import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("[subjects] API called:", req.method);

  // --- Авторизация ---
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const token = cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: number };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  // --- GET: список предметов + статистика ---
  if (req.method === "GET") {
    try {
      // все предметы пользователя с их тестами
      const subjects = await prisma.subject.findMany({
        where: { userId },
        include: { tests: true },
      });

      const subjectStats = subjects.map((s) => {
        const total = s.tests.reduce((acc, t) => acc + t.numQuestions, 0);
        const correct = s.tests.reduce((acc, t) => acc + t.score, 0);
        return {
          id: s.id,
          name: s.name,
          difficulty: s.difficulty,
          totalTests: total,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      });

      return res.status(200).json({ subjects: subjectStats });
    } catch (err) {
      console.error("[subjects] Error (GET):", err);
      return res.status(500).json({ error: "Failed to fetch subjects" });
    }
  }

  // --- POST: создание нового предмета ---
  if (req.method === "POST") {
    const { name, difficulty } = req.body;

    if (!name || !difficulty) {
      return res.status(400).json({ error: "Название и сложность обязательны" });
    }

    try {
      const subject = await prisma.subject.create({
        data: {
          name,
          difficulty,
          userId, // 🔑 привязка к текущему пользователю
        },
      });

      return res.status(200).json(subject);
    } catch (err) {
      console.error("[subjects] Error (POST):", err);
      return res.status(500).json({ error: "Ошибка при создании предмета" });
    }
  }

  // --- Остальные методы ---
  return res.status(405).json({ error: "Method not allowed" });
}
