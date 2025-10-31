// src/lib/submit.ts

export type SubmitAnswer = { qIndex: number; chosenIndex: number };

export type SubmitRequest = {
  generatedTestId: number;
  subjectId?: number | null; // можно не передавать — сервер возьмет из самого теста, если там есть
  answers: SubmitAnswer[];

  // Необязательные тайминги (если измеряешь на фронте)
  durationMs?: number | null;
  startedAt?: string | null;   // ISO-строка
  completedAt?: string | null; // ISO-строка
};

export type SubmitResponse =
  | {
      ok: true;
      attemptId: number;
      accuracy: number; // %
      correct: number;
      total: number;
      byTag: Record<string, { total: number; correct: number; accuracy: number }>;
    }
  | { error: string };

async function readError(res: Response): Promise<string> {
  // Пытаемся прочитать JSON { error } или текст
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => ({}));
      if (j && typeof j.error === "string" && j.error) return j.error;
      return `HTTP ${res.status}`;
    }
    const t = await res.text().catch(() => "");
    return t?.trim() || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Отправка ответов на сервер.
 * Бросает Error при сетевой/HTTP-ошибке, иначе возвращает распарсенный JSON.
 */
export async function submitTest(
  payload: SubmitRequest,
  opts?: { signal?: AbortSignal }
): Promise<SubmitResponse> {
  const res = await fetch("/api/test/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await readError(res);
    // Выкидываем понятную ошибку: её можно показать пользователю
    throw new Error(msg || `Submit failed (${res.status})`);
  }

  // ok
  try {
    const data = (await res.json()) as SubmitResponse;
    return data;
  } catch {
    throw new Error("Submit failed: invalid JSON in response");
  }
}
