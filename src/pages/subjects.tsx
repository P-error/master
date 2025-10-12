import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, ChevronRight, Search, Tag, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { fadeUp } from "@/lib/motion";

type Subject = {
  id: number;
  name: string;
  description?: string;
  topics?: string[];
  totalTests?: number;
  avgAccuracy?: number;
};

export default function SubjectsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  async function fetchSubjects() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list: Subject[] = Array.isArray(data)
        ? data.map((s: any) => ({
            id: Number(s.id ?? s.subjectId ?? 0),
            name: String(s.name ?? s.title ?? "Untitled"),
            description: s.description ? String(s.description) : undefined,
            topics: Array.isArray(s.topics) ? s.topics.map((t: any) => String(t)) : undefined,
            totalTests: typeof s.totalTests === "number" ? s.totalTests : undefined,
            avgAccuracy: typeof s.avgAccuracy === "number" ? s.avgAccuracy : undefined,
          }))
        : Array.isArray(data?.subjects)
        ? data.subjects.map((s: any) => ({
            id: Number(s.id ?? s.subjectId ?? 0),
            name: String(s.name ?? s.title ?? "Untitled"),
            description: s.description ? String(s.description) : undefined,
            topics: Array.isArray(s.topics) ? s.topics.map((t: any) => String(t)) : undefined,
            totalTests: typeof s.totalTests === "number" ? s.totalTests : undefined,
            avgAccuracy: typeof s.avgAccuracy === "number" ? s.avgAccuracy : undefined,
          }))
        : [];

      setSubjects(list.filter((s) => Number.isFinite(s.id) && s.name));
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of subjects) (s.topics || []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return subjects.filter((s) => {
      const matchesQ =
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.description || "").toLowerCase().includes(query) ||
        (s.topics || []).some((t) => t.toLowerCase().includes(query));
      const matchesTag = !activeTag || (s.topics || []).includes(activeTag);
      return matchesQ && matchesTag;
    });
  }, [subjects, q, activeTag]);

  function goToTestPrefilled(s: Subject) {
    const topic = s.topics?.[0] ?? "";
    const tags = (s.topics ?? []).slice(0, 3).join(",");
    const qs = new URLSearchParams({
      subjectId: String(s.id),
      topic,
      tags,
      difficulty: "medium",
      numQuestions: "8",
    });
    router.push(`/test?${qs.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div {...fadeUp(0.02)} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Каталог предметов</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Выбирай дисциплины, просматривай темы и начинай практиковаться.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur dark:bg-gray-900/50">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            <span className="text-gray-700 dark:text-gray-300">Adaptive Curriculum</span>
          </div>
          <button
            onClick={fetchSubjects}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/60 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300"
            title="Обновить"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(0.06)}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-4 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Поиск</label>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Найди предмет, тему или тег…"
                className="w-full rounded-xl border border-white/30 bg-white/70 px-10 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Фильтр по тегу</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`rounded-lg px-3 py-1.5 text-sm transition border ${
                  activeTag === null
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "border-white/20 hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                Все
              </button>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 12).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(t === activeTag ? null : t)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                      activeTag === t
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "border-white/20 hover:bg-white/60 dark:hover:bg-white/5"
                    }`}
                    title={t}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {allTags.length > 12 && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Показаны первые 12 тегов.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="min-h-[40vh]">
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/60 backdrop-blur dark:bg-gray-900/50"
                />
              ))}
              <div className="col-span-full mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка предметов…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && errorMsg && (
          <motion.div
            {...fadeUp(0.02)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <b>Не удалось загрузить предметы</b>
            </div>
            <div>{errorMsg}</div>
            <button
              onClick={fetchSubjects}
              className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/60 px-3 py-1.5 text-gray-700 transition hover:bg-white/80 dark:bg-gray-900/40 dark:text-gray-300"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </motion.div>
        )}

        {!loading && !errorMsg && filtered.length === 0 && (
          <motion.div
            {...fadeUp(0.04)}
            className="rounded-2xl border border-white/10 bg-white/60 p-6 text-sm text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/50 dark:text-gray-300"
          >
            Ничего не найдено. Измени запрос или фильтр по тегу.
          </motion.div>
        )}

        {!loading && !errorMsg && filtered.length > 0 && (
          <motion.div
            {...fadeUp(0.04)}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 backdrop-blur transition hover:shadow-md dark:bg-gray-900/50"
              >
                <div aria-hidden className="pointer-events-none absolute -inset-x-6 top-0 -z-10 h-20 opacity-0 blur-2xl transition group-hover:opacity-100">
                  <div className="h-full w-full bg-gradient-to-r from-indigo-400/20 via-fuchsia-400/20 to-cyan-400/20" />
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-300">
                    <BookOpen size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{s.name}</h3>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">ID: {s.id}</div>
                  </div>
                </div>

                {s.description && (
                  <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">{s.description}</p>
                )}

                {s.topics && s.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topics.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/60 px-2 py-0.5 text-xs text-gray-700 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-300"
                        title={t}
                      >
                        <Tag className="h-3 w-3" />
                        {t}
                      </span>
                    ))}
                    {s.topics.length > 6 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">+{s.topics.length - 6}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {typeof s.totalTests === "number" && <span className="mr-3">Тестов: {s.totalTests}</span>}
                    {typeof s.avgAccuracy === "number" && <span>Средн. точность: {Math.round(s.avgAccuracy * 100)}%</span>}
                  </div>
                  <button
                    onClick={() => goToTestPrefilled(s)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-500/20 dark:text-indigo-300"
                    title="Сгенерировать тест с префиллом"
                  >
                    Начать
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <motion.div
        {...fadeUp(0.06)}
        className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/50 dark:text-gray-300"
      >
        Совет: клик по «Начать» префиллит параметры на странице <Link className="underline" href="/test">Test</Link>.
      </motion.div>
    </div>
  );
}
