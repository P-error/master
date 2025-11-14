// src/pages/test/[sessionId].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { Loader2, CheckCircle2, SendHorizontal, BadgeCheck, XCircle } from "lucide-react";
import QuestionCard, { UserAnswer, Question } from "@/components/QuestionCard";
import { useToast } from "@/lib/toast";

type SessionPayload = {
  id: string;
  subjectId?: number | string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  mode: "academic" | "comfort" | "random";
  tagsVersion?: string | null;
  questions: Question[];
  plannedTagsPerQuestion?: string[][] | null;
  createdAt?: string;
  updatedAt?: string;
};

type SubmitResult = {
  ok: boolean;
  attemptId: number;
  total: number;
  correct: number;
  accuracy: number; // 0..1 (доля)
  targetScore?: number | null;
  passed?: boolean | null;
  byQuestion?: Array<{
    id: string;
    chosenIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    tags: string[];
  }>;
  byTag?: Record<string, { total: number; correct: number; accuracy: number }>;
};

function normalizeQuestion(q: any, i: number): Question {
  const id = String(q?.id ?? q?.qid ?? i + 1);
  const text = String(q?.text ?? q?.question ?? "No question text");
  const options = Array.isArray(q?.options) ? q.options : Array.isArray(q?.answers) ? q.answers : null;
  const type: Question["type"] = Array.isArray(options) ? "single" : "text";
  return { id, text, type, options: Array.isArray(options) ? options : undefined };
}

function normalizeSession(raw: any): SessionPayload {
  const id = String(
    raw?.id ??
      raw?.sessionId ??
      raw?.session?.id ??
      raw?.session?.sessionId ??
      "no-id"
  );

  const list = raw?.questions ?? raw?.session?.questions ?? [];
  const normalizedList: Question[] = Array.isArray(list)
    ? list.map((q: any, i: number) => normalizeQuestion(q, i))
    : [];

  return {
    id,
    subjectId: raw?.subjectId ?? raw?.session?.subjectId ?? undefined,
    topic: raw?.topic ?? raw?.session?.topic ?? undefined,
    difficulty: raw?.difficulty ?? raw?.session?.difficulty ?? "medium",
    mode: raw?.mode ?? raw?.session?.mode ?? "academic",
    tagsVersion: raw?.tagsVersion ?? raw?.session?.tagsVersion ?? null,
    questions: normalizedList,
    plannedTagsPerQuestion: raw?.plannedTagsPerQuestion ?? raw?.session?.plannedTagsPerQuestion ?? null,
    createdAt: raw?.createdAt ?? raw?.session?.createdAt,
    updatedAt: raw?.updatedAt ?? raw?.session?.updatedAt,
  };
}

export default function TestSessionPage() {
  const router = useRouter();

  const toastApi = (useToast?.() as any) || null;
  const toastSuccess = (msg: string) => {
    try {
      if (toastApi?.success) toastApi.success(msg);
      else if (toastApi?.show) toastApi.show({ type: "success", message: msg, title: "Успех" });
      else if (typeof toastApi === "function") toastApi({ type: "success", message: msg });
      else console.log("[toast:success]", msg);
    } catch {
      console.log("[toast:success]", msg);
    }
  };
  const toastError = (msg: string) => {
    try {
      if (toastApi?.error) toastApi.error(msg);
      else if (toastApi?.show) toastApi.show({ type: "error", message: msg, title: "Ошибка" });
      else if (typeof toastApi === "function") toastApi({ type: "error", message: msg });
      else console.error("[toast:error]", msg);
    } catch {
      console.error("[toast:error]", msg);
    }
  };

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const sid = useMemo(() => {
    const q = router.query?.sessionId ?? router.query?.id;
    return Array.isArray(q) ? q[0] : q;
  }, [router.query]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!sid) return;
      setLoading(true);
      setError(null);
      try {
        const url = `/api/tests/session?sessionId=${encodeURIComponent(String(sid))}`;
        const r = await fetch(url);
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        const raw = await r.json();
        const normalized = normalizeSession(raw);

        if (!Array.isArray(normalized.questions) || normalized.questions.length === 0) {
          throw new Error("Сессия не содержит вопросов.");
        }

        if (!alive) return;
        setSession(normalized);
        setAnswers(normalized.questions.map((q) => ({ qid: q.id, answer: null })));
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message || "Ошибка загрузки сессии";
        setError(msg);
        toastError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [sid]);

  const onChangeAnswer = (qid: string, value: number | string | null) => {
    setAnswers((prev) =>
      prev.map((a) => (a.qid === qid ? { ...a, answer: value } : a))
    );
  };

  const allAnswered = useMemo(() => {
    if (!session?.questions?.length) return false;
    return (
      answers.length === session.questions.length &&
      answers.every((a, idx) => {
        const q = session.questions[idx];
        if (q.type === "single") return typeof a.answer === "number" && a.answer >= 0;
        return typeof a.answer === "string" && a.answer.trim().length > 0;
      })
    );
  }, [answers, session]);

  const onSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const subjectIdNum = session.subjectId != null ? Number(session.subjectId) : undefined;
      const payload = {
        sessionId: Number(session.id),
        subjectId: subjectIdNum,
        topic: session.topic ?? "",
        difficulty: session.difficulty,
        questions: session.questions.map((q) => ({
          id: q.id,
          question: q.text,
          options: q.options ?? [],
        })),
        answers: answers.map((a) => (typeof a.answer === "number" ? a.answer : -1)),
      };

      const r = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      const data = (await r.json()) as SubmitResult;
      setResult(data);
      toastSuccess("Результат подсчитан");
    } catch (e: any) {
      const msg = e?.message || "Ошибка отправки ответов";
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const percent = result ? Math.round(result.accuracy * 100) : null;

  return (
    <>
      <Head>
        <title>Сессия теста</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <motion.section
          variants={fadeVariants()}
          initial="hidden"
          animate="visible"
          transition={trans(0)}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">Сессия теста</h1>
          {session?.topic && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Тема: {session.topic}
            </p>
          )}
        </motion.section>

        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Загружаем вопросы…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-300/40 bg-red-50/50 px-3 py-2 text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && session && (
          <>
            {!result && (
              <>
                <div className="space-y-4">
                  {session.questions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      index={idx + 1}
                      value={answers[idx]?.answer ?? null}
                      onChange={(val) => onChangeAnswer(q.id, val)}
                      question={q}
                    />
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    disabled={!allAnswered || submitting}
                    onClick={onSubmit}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                    title={!allAnswered ? "Ответьте на все вопросы" : "Отправить ответы"}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : allAnswered ? (
                      <SendHorizontal className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Отправить
                  </button>
                </div>
              </>
            )}

            {result && (
              <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold">Результат</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Верно: <b>{result.correct}</b> из <b>{result.total}</b>
                    {percent !== null ? <> ({percent}%)</> : null}
                  </p>

                  {typeof result.targetScore === "number" && (
                    <p className="mt-1 text-sm">
                      {result.passed === true && (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <BadgeCheck className="h-4 w-4" />
                          <span>
                            Тест пройден. Порог: {result.targetScore}%.
                          </span>
                        </span>
                      )}
                      {result.passed === false && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span>
                            Тест не пройден. Порог: {result.targetScore}%.
                          </span>
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {Array.isArray(result.byQuestion) && result.byQuestion.length > 0 && (
                  <ul className="space-y-2">
                    {result.byQuestion.map((r, idx) => {
                          // берём ответ из локального стейта answers, если он есть;
                          // иначе падаем обратно на chosenIndex, пришедший с бэка
                          const userAns = answers[idx];
                          const chosenIdx =
                            userAns && typeof (userAns as any).answer === "number"
                              ? (userAns as any).answer
                              : r.chosenIndex;

                          return (
                            <li
                              key={r.id ?? idx}
                              className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                {r.isCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                                <div className="text-sm">
                                  <div className="font-medium">Вопрос {idx + 1}</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Выбрано: {chosenIdx >= 0 ? chosenIdx + 1 : "—"}, правильный:{" "}
                                    {r.correctIndex >= 0 ? r.correctIndex + 1 : "—"}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}

                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
