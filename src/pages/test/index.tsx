// src/pages/test/index.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { Loader2, Target, Settings2 } from "lucide-react";
import TestForm, { GenPayload } from "@/components/TestForm";
import { useToast } from "@/lib/toast";

type GenSuccess = { sessionId: string; questions?: any[] } | { id: string; questions?: any[] };

export default function TestIndexPage() {
  const router = useRouter();
  const { notify } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(payload: GenPayload) {
    setLoading(true);
    setError(null);

    try {
      // нормализуем полезную нагрузку для API
      const body = {
        subjectId: payload.subjectId ?? undefined,
        topic: payload.topic ?? "",
        difficulty: payload.difficulty,
        count: payload.count,
        goal: payload.goal,
        mode: payload.mode, // НОВОЕ: режим передаём на сервер
      };

      const r = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        let message = `Ошибка HTTP ${r.status}`;
        try {
          const data = (await r.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON errors
        }
        setError(message);
        notify({
          type: "error",
          title: "Не удалось сгенерировать тест",
          message,
          timeout: 5000,
        });
        return;
      }

      const data = (await r.json()) as GenSuccess;
      const sessionId = (data as any).sessionId ?? (data as any).id;

      if (!sessionId) {
        const message = "Сервер не вернул идентификатор сессии.";
        setError(message);
        notify({
          type: "error",
          title: "Некорректный ответ сервера",
          message,
          timeout: 5000,
        });
        return;
      }

      notify({
        type: "success",
        title: "Тест сгенерирован",
        message: "Сейчас откроется страница с вопросами.",
        timeout: 3000,
      });

      await router.push(`/test/${encodeURIComponent(String(sessionId))}`);
    } catch (e: any) {
      const message = e?.message ?? "Неизвестная ошибка при генерации теста.";
      setError(message);
      notify({
        type: "error",
        title: "Ошибка генерации",
        message,
        timeout: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Генерация теста — DissertAssist</title>
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
        {/* Заголовок */}
        <motion.section
          variants={fadeVariants(0)}
          initial="hidden"
          animate="show"
          className="mb-6 rounded-2xl border border-gray-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/60"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-50 md:text-xl">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Генерация теста
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Укажи предмет или тему, сложность, режим и количество вопросов. После генерации ты перейдёшь к
                прохождению теста.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950/60 dark:text-blue-100">
              <Settings2 className="h-4 w-4" />
              <span>Параметры теста можно менять перед каждой генерацией.</span>
            </div>
          </div>
        </motion.section>

        {/* Форма + статус генерации */}
        <motion.section
          variants={fadeVariants(0.05)}
          initial="hidden"
          animate="show"
          transition={trans(0.05)}
          className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70"
        >
          <div className="space-y-4">
            <TestForm disabled={loading} onSubmit={handleGenerate} />

            {loading && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Генерируем тест…
              </div>
            )}

            {error && !loading && (
              <div className="mt-4 rounded-lg border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </>
  );
}
