import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type Data =
  | { ok: true; selectedTags: string[]; debugCounts: Record<string, number> }
  | { ok: false; error: string };

// Универсальная нормализация к string[] — работает и когда tags: Json, и когда tags: String[]
function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    // Если это уже массив — оставляем только строки
    return value.filter((x): x is string => typeof x === 'string');
  }
  if (typeof value === 'string') {
    // Иногда в БД может лежать строка с JSON
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [];
    } catch {
      return [];
    }
  }
  // JsonObject/number/boolean/null → пусто
  return [];
}

async function getUnderExploredTags(userId: number): Promise<Record<string, number>> {
  const results = await prisma.questionTagResult.findMany({
    where: { userId },
    select: { tags: true }, // тип может быть JsonValue или string[] в зависимости от сгенерённого клиента
  });

  const counts: Record<string, number> = {};
  for (const r of results) {
    // приводим к string[] независимо от текущей схемы
    const tags: string[] = normalizeTags((r as { tags: unknown }).tags);
    for (const t of tags) {
      const tag = t.trim();
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

function pickLeastSeenTags(counts: Record<string, number>, limit: number): string[] {
  const entries = Object.entries(counts);
  if (entries.length === 0) return [];
  entries.sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0));
  return entries.slice(0, Math.max(0, limit)).map(([tag]) => tag);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const { userId, count } = req.body ?? {};
    const uid = Number(userId);
    const limit = Number(count) > 0 ? Number(count) : 5;

    if (!Number.isFinite(uid) || uid <= 0) {
      res.status(400).json({ ok: false, error: 'Invalid or missing userId' });
      return;
    }

    const counts = await getUnderExploredTags(uid);
    const selected = pickLeastSeenTags(counts, limit);

    // здесь можно добавить генерацию вопросов через OpenAI по выбранным тегам
    res.status(200).json({ ok: true, selectedTags: selected, debugCounts: counts });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}
