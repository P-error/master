import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { Loader2, CheckCircle2, SendHorizontal } from "lucide-react";
import QuestionCard, { UserAnswer, Question } from "@/components/QuestionCard";
import { useToast } from "@/lib/toast";

type SessionPayload = {
    id: string;
    subjectId?: string;
    questions: Question[];
    // могут быть любые дополнительные поля
};

type SubmitResponse =
| { score?: number; grade?: string; labels?: string[]; correct?: number; total?: number }
| Record<string, any>;

export default function TestSessionPage() {
    const router = useRouter();
    const { sessionId } = router.query as { sessionId?: string };
    const { notify } = useToast();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionPayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [answers, setAnswers] = useState<UserAnswer[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResponse | null>(null);

    // загрузка сессии
    useEffect(() => {
        if (!sessionId) return;
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const urls = [
                    `/api/tests/session?id=${encodeURIComponent(sessionId)}`,
         `/api/test/session?id=${encodeURIComponent(sessionId)}`,
         `/api/tests/${encodeURIComponent(sessionId)}`,
                ];
                let ok = false;
                let data: any = null;
                for (const url of urls) {
                    const res = await fetch(url, {
                        method: "GET",
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }).catch(() => null as any);
                    if (res && res.ok) {
                        data = await res.json().catch(() => ({}));
                        ok = true;
                        break;
                    }
                }
                if (!ok) throw new Error("Не удалось загрузить сессию (возможно 401/404).");

                const normalized: SessionPayload = normalizeSession(data);
                if (!normalized.questions || normalized.questions.length === 0) {
                    throw new Error("Сессия не содержит вопросов.");
                }

                if (!alive) return;
                setSession(normalized);
                setAnswers(
                    normalized.questions.map((q) => ({
                        qid: q.id,
                        answer: null,
                    }))
                );
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message || "Ошибка загрузки сессии.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [sessionId]);

    const allAnswered = useMemo(() => {
        if (!answers.length) return false;
        return answers.every((a) => a.answer !== null && a.answer !== undefined);
    }, [answers]);

    async function handleSubmit() {
        if (!sessionId) return;
        setSubmitting(true);
        setResult(null);
        try {
            const payload = {
                sessionId,
                answers,
                action: "submit",
            };

            const urls = [
                "/api/tests/submit",
                "/api/test/submit",
                "/api/submit-test",
                "/api/tests",
            ];

            let ok = false;
            let data: any = null;
            for (const url of urls) {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }).catch(() => null as any);
                if (res && res.ok) {
                    data = await res.json().catch(() => ({}));
                    ok = true;
                    break;
                }
            }

            if (!ok) throw new Error("Не удалось отправить ответы.");

            setResult(data as SubmitResponse);
            // 🎯 Если бэкенд возвращает метки/оценку — не трогаем логику, просто показываем.
            if ((data as any)?.labels?.length) {
                notify({ type: "success", message: "Отправлено. Метки/оценка получены." });
            } else {
                notify({ type: "success", message: "Отправлено." });
            }
        } catch (e: any) {
            notify({ type: "error", message: e?.message || "Ошибка отправки." });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
        <Head>
        <title>Test Session — EduAI</title>
        </Head>

        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Test</h1>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Сессия: {sessionId ?? "—"}
        </p>
        </motion.div>

        {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-3 text-sm dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
            </div>
        )}

        {!loading && error && (
            <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">
            {error}
            </div>
        )}

        {!loading && !error && session && (
            <div className="space-y-3">
            {session.questions.map((q, idx) => (
                <QuestionCard
                key={q.id}
                index={idx}
                question={q}
                value={answers[idx]?.answer ?? null}
                onChange={(val) =>
                    setAnswers((prev) => {
                        const clone = [...prev];
                        clone[idx] = { qid: q.id, answer: val };
                        return clone;
                    })
                }
                />
            ))}

            <button
            type="button"
            disabled={submitting || !allAnswered}
            onClick={handleSubmit}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primaryFg transition hover:opacity-90 disabled:opacity-60"
            >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
            {submitting ? "Отправка…" : "Отправить ответы"}
            </button>

            {result && (
                <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: trans(0.05, 0.35) }}
                className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm shadow-soft dark:bg-white/5"
                >
                <div className="mb-1 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Результаты
                </div>
                <div className="grid gap-1 sm:grid-cols-2">
                {"score" in result && (
                    <div>Score: <b>{(result as any).score}</b></div>
                )}
                {"grade" in result && (
                    <div>Grade: <b>{(result as any).grade}</b></div>
                )}
                {"correct" in result && "total" in result && (
                    <div>
                    Correct: <b>{(result as any).correct}</b> / {(result as any).total}
                    </div>
                )}
                {"labels" in result && Array.isArray((result as any).labels) && (
                    <div className="sm:col-span-2">
                    Labels:
                    <div className="mt-1 flex flex-wrap gap-1">
                    {(result as any).labels.map((t: string) => (
                        <span key={t} className="rounded-lg bg-white/70 px-2 py-1 text-xs shadow-sm dark:bg-white/10">
                        {t}
                        </span>
                    ))}
                    </div>
                    </div>
                )}
                </div>
                </motion.div>
            )}
            </div>
        )}
        </section>
        </>
    );
}

function normalizeSession(raw: any): SessionPayload {
    // пытаемся понять схему
    const id = raw?.id ?? raw?.sessionId ?? raw?.session?.id ?? raw?.session?.sessionId ?? "no-id";
    const list =
    raw?.questions ??
    raw?.session?.questions ??
    [];
    const normalized: Question[] = Array.isArray(list)
    ? list.map((q: any, i: number) => normalizeQuestion(q, i))
    : [];
    return { id, subjectId: raw?.subjectId ?? raw?.session?.subjectId, questions: normalized };
}

function normalizeQuestion(q: any, i: number): Question {
    const id = q?.id ?? q?.qid ?? String(i + 1);
    const text = q?.text ?? q?.question ?? "No question text";
    const options = q?.options ?? q?.answers ?? null;
    const type: Question["type"] = Array.isArray(options) ? "single" : "text";
    return { id, text, type, options: Array.isArray(options) ? options : undefined };
}
