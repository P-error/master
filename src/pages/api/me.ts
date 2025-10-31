// src/pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  // Можно вернуть просто payload, но лучше подтянуть актуальные поля из БД
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      login: true,
      email: true,
      age: true,
      educationLevel: true,
      learningGoal: true,
      learningStyle: true,
      preferredFormat: true,
      preferredTone: true,
      detailLevel: true,
      priorKnowledge: true,
      languageLevel: true,
      darkMode: true,
      accessibleMode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ user });
}
