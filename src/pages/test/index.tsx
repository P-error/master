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

  // Универсальный доступ к любому API тостов
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate(payload: GenPayload) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: payload.subjectId,
          topic: payload.topic,
          difficulty: payload.difficulty,
          count: payload.count,
          goal: payload.goal,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      const data: GenSuccess = await r.json();
      const sid = (data as any).sessionId ?? (data as any).id;
      if (!sid) throw new Error("Не удалось получить sessionId");
      toastSuccess("Тест сгенерирован");
      router.push(`/test/${encodeURIComponent(String(sid))}`);
    } catch (e: any) {
      const msg = e?.message || "Ошибка генерации теста";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Сгенерировать тест</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <motion.section
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={trans(0)}
          className="mb-6"
        >
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Target className="h-6 w-6" />
            Генерация теста
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Укажи тему, сложность и количество вопросов. После генерации ты перейдёшь к прохождению.
          </p>
        </motion.section>

        <motion.section
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={trans(0.05)}
        >
          <div className="rounded-2xl border border-gray-200/60 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              <Settings2 className="h-4 w-4" />
              Параметры генерации
            </div>

            <TestForm disabled={loading} onSubmit={onGenerate} />

            {loading && (
              <div className="mt-4 flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Генерация…
              </div>
            )}

            {error && !loading && (
              <div className="mt-4 rounded-lg border border-red-300/40 bg-red-50/50 px-3 py-2 text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </>
  );
}
