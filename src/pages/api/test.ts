import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { login } = req.query;
  const body = req.body;

  if (req.method === "POST") {
    const { topic, difficulty, numQuestions, numOptions, score, questions } = body;

    if (!login) return res.status(400).json({ error: "Login required" });

    try {
      const user = await prisma.user.findUnique({ where: { login: String(login) } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const test = await prisma.test.create({
        data: {
          userId: user.id,
          topic,
          difficulty,
          numQuestions,
          numOptions,
          score,
          questions,
        },
      });

      res.status(200).json({ test });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save test" });
    }
  } else if (req.method === "GET") {
    if (!login) return res.status(400).json({ error: "Login required" });

    try {
      const user = await prisma.user.findUnique({
        where: { login: String(login) },
        include: { tests: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      res.status(200).json({ tests: user.tests || [] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
