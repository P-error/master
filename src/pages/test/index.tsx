import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { Loader2, Target, Settings2 } from "lucide-react";
import TestForm, { GenPayload } from "@/components/TestForm";
import { useToast } from "@/lib/toast";

type GenSuccess =
  | { sessionId: string; questions?: any[] }
  | { id: string; questions?: any[] }; // на случай, если бэкенд возвращает id

export default function TestIndexPage() {
  const router = useRouter();
  const { subject } = router.query as { subject?: string };
  const { notify } = useToast();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(values: GenPayload) {
    setBusy(true);
    setError(null);
    try {
      // Пул «известных» роутов. Первый, кто вернул 2xx, — победил.
      const endpoints = [
        "/api/tests/generate",
        "/api/test/generate",
        "/api/generate-test",
        "/api/tests", // иногда используют один POST с action
      ];
      const body = JSON.stringify({
        subjectId: values.subjectId ?? subject ?? null,
        difficulty: values.difficulty,
        count: values.count,
        goal: values.goal,
        action: "generate",
      });

      let ok = false;
      let data: any = null;

      for (const url of endpoints) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          credentials: "include",
        }).catch(() => null as any);

        if (res && res.ok) {
          data = await res.json().catch(() => ({}));
          ok = true;
          break;
        }
      }

      if (!ok) throw new Error("Не удалось сгенерировать тест (возможен 400/401).");

      const success = data as GenSuccess;
      const sessionId = (success as any).sessionId ?? (success as any).id;
      if (!sessionId) {
        // нек-рые API сразу возвращают вопросы, но без session — всё равно открываем раннер и передаём state
        notify({ type: "success", message: "Тест создан (без ID). Открываю прохождение…" });
        router.push({ pathname: "/test/preview", query: {} }, "/test/preview"); // запасной маршрут, если есть
        return;
      }

      notify({ type: "success", message: "Тест создан. Удачи!" });
      router.push(`/test/${encodeURIComponent(sessionId)}`);
    } catch (e: any) {
      const msg = e?.message || "Ошибка генерации.";
      setError(msg);
      notify({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Generate Test — EduAI</title>
      </Head>

      <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Target className="h-6 w-6 text-primary" />
            Generate a test
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Выберите параметры и начните адаптивный тест. Если вы передали <code>?subject=ID</code>, он подставится автоматически.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: trans(0.05, 0.35) }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 shadow-soft backdrop-blur-xs dark:bg-white/5"
        >
          <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4" />
            Параметры
          </div>

          <TestForm
            defaultValues={{
              subjectId: subject ?? "",
              difficulty: "Medium",
              count: 10,
              goal: 85,
            }}
            disabled={busy}
            onSubmit={handleGenerate}
          />

          {error && (
            <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => handleGenerate({
              subjectId: subject ?? "",
              difficulty: "Medium",
              count: 10,
              goal: 85,
            })}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primaryFg transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Создаю…" : "Создать тест"}
          </button>
        </motion.div>
      </section>
    </>
  );
}
