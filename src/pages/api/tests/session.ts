// src/pages/api/tests/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function mapDifficultyToLower(d: any): "easy" | "medium" | "hard" {
  const v = String(d ?? "").toUpperCase();
  if (v === "EASY") return "easy";
  if (v === "HARD") return "hard";
  return "medium";
}
function mapModeToLower(m: any): "academic" | "comfort" | "random" {
  const v = String(m ?? "").toUpperCase();
  if (v === "COMFORT") return "comfort";
  if (v === "RANDOM") return "random";
  return "academic";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Требуется авторизация" });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const idRaw = (req.query.id ?? req.query.sessionId) as string | undefined;
  const idNum = Number(idRaw);
  if (!idRaw || !Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Некорректный идентификатор сессии" });
  }

  const gt = await prisma.generatedTest.findUnique({
    where: { id: idNum },
    select: {
      id: true,
      subjectId: true,
      topic: true,
      difficulty: true,
      mode: true,
      tagsVersion: true,
      plannedTagsPerQuestion: true,
      questions: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!gt) return res.status(404).json({ error: "Сессия не найдена" });

  const list = Array.isArray(gt.questions) ? gt.questions : [];

  return res.status(200).json({
    id: String(gt.id),
    subjectId: gt.subjectId ?? undefined,
    topic: gt.topic,
    difficulty: mapDifficultyToLower(gt.difficulty),
    mode: mapModeToLower(gt.mode),
    tagsVersion: gt.tagsVersion ?? null,
    questions: list,
    plannedTagsPerQuestion: gt.plannedTagsPerQuestion ?? null,
    createdAt: gt.createdAt,
    updatedAt: gt.updatedAt,
  });
}
