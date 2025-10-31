// pages/api/subjects.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type SubjectItem = {
  id: number;
  name: string;
  difficulty: Difficulty;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    generatedTests: number;
    testAttempts: number;
  };
  lastAttempt?: {
    id: number;
    createdAt: string;
    accuracy: number; // %
    total: number;
    correct: number;
  } | null;
};

type ApiListOk = { ok: true; items: SubjectItem[] };
type ApiCreateOk = { ok: true; subject: SubjectItem };
type ApiErr = { error: string };

function bad(res: NextApiResponse<ApiErr>, code: number, msg: string) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(code).json({ error: msg });
}

function noCache(res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

const DIFFS = new Set(["EASY", "MEDIUM", "HARD"]);
function asDifficulty(v?: string): Difficulty {
  const up = String(v ?? "MEDIUM").toUpperCase();
  return (DIFFS.has(up) ? (up as Difficulty) : "MEDIUM");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiListOk | ApiCreateOk | ApiErr>
) {
  const auth = requireUser(req);
  const uid = auth?.userId;
  if (!uid) return bad(res, 401, "Unauthorized");

  if (req.method === "GET") {
    try {
      noCache(res);

      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const limitRaw = Number(req.query.limit);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100;

      const where = {
        userId: uid,
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" as const },
            }
          : {}),
      };

      const subjects = await prisma.subject.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          difficulty: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { generatedTests: true, testAttempts: true },
          },
          testAttempts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              createdAt: true,
              accuracy: true,
              total: true,
              correct: true,
            },
          },
        },
      });

      const items: SubjectItem[] = subjects.map((s) => ({
        id: s.id,
        name: s.name,
        difficulty: s.difficulty as Difficulty,
        description: s.description ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        _count: s._count,
        lastAttempt:
          s.testAttempts.length > 0
            ? {
                id: s.testAttempts[0].id,
                createdAt: s.testAttempts[0].createdAt.toISOString(),
                accuracy: s.testAttempts[0].accuracy,
                total: s.testAttempts[0].total,
                correct: s.testAttempts[0].correct,
              }
            : null,
      }));

      return res.status(200).json({ ok: true, items });
    } catch (err: any) {
      return bad(res, 500, err?.message || "Internal Server Error");
    }
  }

  if (req.method === "POST") {
    try {
      noCache(res);

      const { name, difficulty, description } = (req.body || {}) as {
        name?: string;
        difficulty?: string;
        description?: string | null;
      };

      const normName = (name ?? "").trim();
      if (!normName) return bad(res, 400, "Field 'name' is required");

      const diff = asDifficulty(difficulty);
      const desc = typeof description === "string" ? description : null;

      // Проверка дубля (уникальность в схеме: @@unique([userId, name, difficulty]))
      const existing = await prisma.subject.findFirst({
        where: { userId: uid, name: normName, difficulty: diff },
        select: { id: true },
      });
      if (existing) return bad(res, 409, "Subject with the same name and difficulty already exists");

      const created = await prisma.subject.create({
        data: {
          user: { connect: { id: uid } }, // надёжная связь по отношению
          name: normName,
          difficulty: diff,
          description: desc,
        },
        select: {
          id: true,
          name: true,
          difficulty: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { generatedTests: true, testAttempts: true } },
          testAttempts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              createdAt: true,
              accuracy: true,
              total: true,
              correct: true,
            },
          },
        },
      });

      const subject: SubjectItem = {
        id: created.id,
        name: created.name,
        difficulty: created.difficulty as Difficulty,
        description: created.description ?? null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        _count: created._count,
        lastAttempt:
          created.testAttempts.length > 0
            ? {
                id: created.testAttempts[0].id,
                createdAt: created.testAttempts[0].createdAt.toISOString(),
                accuracy: created.testAttempts[0].accuracy,
                total: created.testAttempts[0].total,
                correct: created.testAttempts[0].correct,
              }
            : null,
      };

      return res.status(201).json({ ok: true, subject });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return bad(res, 409, "Subject with the same name and difficulty already exists");
      }
      return bad(res, 500, err?.message || "Internal Server Error");
    }
  }

  return bad(res, 405, "Method Not Allowed");
}
