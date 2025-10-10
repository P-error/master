import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

// replaced by prisma singleton

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded: any = verify(token, process.env.JWT_SECRET || "dev_secret");
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subjects: true }, // подтягиваем предметы
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json(user);
    } catch (err) {
      console.error("[profile GET] Error:", err);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  if (req.method === "POST") {
    const {
      age,
      educationLevel,
      learningGoal,
      learningStyle,
      preferredFormat,
      preferredTone,
      detailLevel,
      priorKnowledge,
      languageLevel,
    } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          age,
          educationLevel,
          learningGoal,
          learningStyle,
          preferredFormat,
          preferredTone,
          detailLevel,
          priorKnowledge,
          languageLevel,
        },
      });

      return res.status(200).json(user);
    } catch (err) {
      console.error("[profile POST] Error:", err);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
