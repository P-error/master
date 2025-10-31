// src/pages/api/statistics.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type SubjectStat = { subjectId: number; subjectName: string; attempts: number; accuracy: number };
type TagStat = { tag: string; total: number; correct: number; accuracy: number };
type TimelinePoint = { id: number; subjectId: number; subjectName: string; createdAt: string; accuracy: number };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireUser(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, subjectId: true, topic: true, total: true, correct: true, accuracy: true,
        byTag: true, createdAt: true,
      },
    });

    const totalTests = attempts.length;
    const totalQuestions = attempts.reduce((s, a) => s + (a.total ?? 0), 0);
    const totalCorrect = attempts.reduce((s, a) => s + (a.correct ?? 0), 0);
    const overallAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    // subject stats
    const subjectAgg = new Map<number, { attempts: number; total: number; correct: number }>();
    for (const a of attempts) {
      const sid = a.subjectId;
      const agg = subjectAgg.get(sid) ?? { attempts: 0, total: 0, correct: 0 };
      agg.attempts += 1;
      agg.total += a.total ?? 0;
      agg.correct += a.correct ?? 0;
      subjectAgg.set(sid, agg);
    }
    const subjectIds = [...subjectAgg.keys()];
    const subjects = subjectIds.length
      ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(subjects.map((s) => [s.id, s.name]));
    const subjectStats: SubjectStat[] = subjectIds.map((sid) => {
      const agg = subjectAgg.get(sid)!;
      const acc = agg.total > 0 ? agg.correct / agg.total : 0;
      return { subjectId: sid, subjectName: nameById.get(sid) ?? `#${sid}`, attempts: agg.attempts, accuracy: acc };
    }).sort((a,b)=> b.attempts - a.attempts);

    // tag stats
    const tagAgg = new Map<string, { total: number; correct: number }>();
    for (const a of attempts) {
      const byTag = (a.byTag ?? {}) as Record<string, { total: number; correct: number }>;
      for (const [tag, val] of Object.entries(byTag)) {
        const cur = tagAgg.get(tag) ?? { total: 0, correct: 0 };
        cur.total += val?.total ?? 0;
        cur.correct += val?.correct ?? 0;
        tagAgg.set(tag, cur);
      }
    }
    const tagStats: TagStat[] = [...tagAgg.entries()].map(([tag, v]) => ({
      tag, total: v.total, correct: v.correct, accuracy: v.total > 0 ? v.correct / v.total : 0,
    })).sort((a,b)=> b.total - a.total);

    // timeline (последние 20)
    const timeline: TimelinePoint[] = attempts.slice(0, 20).map((a) => ({
      id: a.id,
      subjectId: a.subjectId,
      subjectName: nameById.get(a.subjectId) ?? `#${a.subjectId}`,
      createdAt: a.createdAt.toISOString(),
      accuracy: a.accuracy ?? (a.total ? (a.correct ?? 0) / a.total : 0),
    }));

    res.status(200).json({
      totalTests, totalQuestions, totalCorrect, overallAccuracy,
      subjectStats, tagStats, timeline,
    });
  } catch (err) {
    console.error("[/api/statistics] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
