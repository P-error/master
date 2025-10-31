// src/pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const profile = await prisma.user.findUnique({
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
    if (!profile) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ profile });
  }

  if (req.method === "PATCH") {
    const body = typeof req.body === "string" ? safeParse(req.body) : req.body ?? {};
    // Допускаем частичное обновление
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
      darkMode,
      accessibleMode,
    } = body || {};

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        age: isNum(age) ? Number(age) : undefined,
        educationLevel: nvl(educationLevel),
        learningGoal: nvl(learningGoal),
        learningStyle: nvl(learningStyle),
        preferredFormat: nvl(preferredFormat),
        preferredTone: nvl(preferredTone),
        detailLevel: nvl(detailLevel),
        priorKnowledge: nvl(priorKnowledge),
        languageLevel: nvl(languageLevel),
        darkMode: typeof darkMode === "boolean" ? darkMode : undefined,
        accessibleMode: typeof accessibleMode === "boolean" ? accessibleMode : undefined,
      },
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

    return res.status(200).json({ profile: updated });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}
function nvl(v: any) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
function isNum(v: any) {
  return v !== undefined && v !== null && !Number.isNaN(Number(v));
}
