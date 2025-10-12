import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Target, Award, RefreshCw, AlertTriangle, CalendarClock, Tag, Loader2 } from "lucide-react";
import Link from "next/link";
import { fadeUp } from "@/lib/motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type TagStat = { tag: string; total: number; correct: number; accuracy: number };
type Attempt = {
  id: number; createdAt: string; subjectId: number; topic: string;
  difficulty: "easy" | "medium" | "hard"; total: number; correct: number; accuracy: number;
};
type StatsResponse = {
  totalAttempts: number; avgAccuracy: number;
  bestTag?: { tag: string; accuracy: number };
  weakestTag?: { tag: string; accuracy: number };
  recentAttempts: Attempt[]; byTag: TagStat[];
};

function formatPct(x: number) {
  if (!isFinite(x)) return "—"; return `${Math.round(x * 100)}%`;
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  async function fetchStats() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/statistics");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const normalized: StatsResponse = {
        totalAttempts: Number(data.totalAttempts ?? data?.summary?.totalAttempts ?? 0),
        avgAccuracy: Number(data.avgAccuracy ?? data?.summary?.avgAccuracy ?? 0),
        bestTag: data.bestTag ?? data?.summary?.bestTag ?? undefined,
        weakestTag: data.weakestTag ?? data?.summary?.weakestTag ?? undefined,
        byTag: Array.isArray(data.byTag)
          ? data.byTag.map((t: any) => ({
              tag: String(t.tag ?? t.name ?? "unknown"),
              total: Number(t.total ?? 0),
              correct: Number(t.correct ?? 0),
              accuracy: Number(t.accuracy ?? 0),
            }))
          : [],
        recentAttempts: Array.isArray(data.recentAttempts)
          ? data.recentAttempts.map((a: any) => ({
              id: Number(a.id ?? 0),
              createdAt: String(a.createdAt ?? a.created_at ?? new Date().toISOString()),
              subjectId: Number(a.subjectId ?? a.subject_id ?? 0),
              topic: String(a.topic ?? "—"),
              difficulty: (a.difficulty ?? "medium") as Attempt["difficulty"],
              total: Number(a.total ?? 0),
              correct: Number(a.correct ?? 0),
              accuracy: Number(a.accuracy ?? (a.total ? a.correct / a.total : 0)),
            }))
          : [],
      };

      setStats(normalized);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load statistics");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  const tiles = useMemo(() => {
    const total = stats?.totalAttempts ?? 0;
    const avg = stats?.avgAccuracy ?? 0;
    const best = stats?.bestTag;
    const weak = stats?.weakestTag;
    return [
      { icon: <BarChart3 className="h-5 w-5 text-indigo-500" />, label: "Всего попыток", value: total.toString(), hint: total > 0 ? "Отличный прогресс" : "Пока пусто — начни с теста" },
      { icon: <TrendingUp className="h-5 w-5 text-emerald-500" />, label: "Средняя точность", value: formatPct(avg), hint: avg >= 0.7 ? "Высокий уровень" : avg >= 0.4 ? "Средний уровень" : "Нужно подтянуть" },
      { icon: <Award className="h-5 w-5 text-cyan-500" />, label: "Сильная тема", value: best?.tag ? `${best.tag}` : "—", hint: best?.accuracy != null ? `≈ ${formatPct(best.accuracy)}` : "Сдай пару тестов" },
      { icon: <Target className="h-5 w-5 text-fuchsia-500" />, label: "Слабая тема", value: weak?.tag ? `${weak.tag}` : "—", hint: weak?.accuracy != null ? `≈ ${formatPct(weak.accuracy)}` : "Нужны данные" },
    ];
  }, [stats]);

  const chartData = useMemo(() => {
    return (stats?.byTag ?? [])
      .slice()
      .sort((a, b) => b.accuracy - a.accuracy)
      .map((t) => ({ tag: t.tag, accuracyPct: Math.round(t.accuracy * 100) }))
      .slice(0, 8);
  }, [stats]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div {...fadeUp(0.02)} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Статистика и прогресс</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Сводка попыток, точность по темам и история результатов.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/60 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </button>
      </motion.div>

      <motion.div {...fadeUp(0.06)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: i * 0.03 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 backdrop-blur transition hover:shadow-md dark:bg-gray-900/50"
          >
            <div aria-hidden className="pointer-events-none absolute -inset-x-6 top-0 -z-10 h-20 opacity-0 blur-2xl transition group-hover:opacity-100">
              <div className="h-full w-full bg-gradient-to-r from-indigo-400/20 via-fuchsia-400/20 to-cyan-400/20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/60 p-2 dark:bg-gray-950/40">{t.icon}</div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.label}</div>
                <div className="text-xl font-semibold">{t.value}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{t.hint}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      {!loading && !errorMsg && chartData.length > 0 && (
        <motion.section {...fadeUp(0.08)} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur dark:bg-gray-900/50">
          <div className="mb-3 text-lg font-semibold">Точность по темам (топ-8)</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <XAxis dataKey="tag" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="accuracyPct" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/60 backdrop-blur dark:bg-gray-900/50" />
            ))}
            <div className="col-span-full mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка статистики…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && errorMsg && (
        <motion.div {...fadeUp(0.02)} className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <b>Не удалось загрузить статистику</b>
          </div>
          <div>{errorMsg}</div>
          <button
            onClick={fetchStats}
            className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/60 px-3 py-1.5 text-gray-700 transition hover:bg-white/80 dark:bg-gray-900/40 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Повторить
          </button>
        </motion.div>
      )}

      {!loading && !errorMsg && stats && (
        <motion.section {...fadeUp(0.08)} className="space-y-4">
          <h2 className="text-lg font-semibold">Точность по темам (таблица)</h2>
          {stats.byTag.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/60 p-5 text-sm text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/50 dark:text-gray-300">
              Пока нет данных по тегам. Пройди один-два теста.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur dark:bg-gray-900/50">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/40 text-left text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                      <th className="px-4 py-3"><div className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> Tag</div></th>
                      <th className="px-4 py-3">Всего</th>
                      <th className="px-4 py-3">Верно</th>
                      <th className="px-4 py-3">Точность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byTag
                      .slice()
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .map((t) => (
                        <tr key={t.tag} className="border-b border-white/10 last:border-0">
                          <td className="px-4 py-3">{t.tag}</td>
                          <td className="px-4 py-3">{t.total}</td>
                          <td className="px-4 py-3">{t.correct}</td>
                          <td className="px-4 py-3">{formatPct(t.accuracy)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {!loading && !errorMsg && stats && (
        <motion.section {...fadeUp(0.1)} className="space-y-4">
          <h2 className="text-lg font-semibold">Последние попытки</h2>
          {stats.recentAttempts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/60 p-5 text-sm text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/50 dark:text-gray-300">
              История пуста. Сгенерируй и пройди тест на странице <Link className="underline" href="/test">Test</Link>.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur dark:bg-gray-900/50">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/40 text-left text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                      <th className="px-4 py-3"><div className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" /> Дата</div></th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Diff</th>
                      <th className="px-4 py-3">Верно</th>
                      <th className="px-4 py-3">Всего</th>
                      <th className="px-4 py-3">Точность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAttempts.map((a) => {
                      const date = new Date(a.createdAt);
                      const dateStr = isNaN(date.getTime()) ? a.createdAt : date.toLocaleString();
                      return (
                        <tr key={a.id} className="border-b border-white/10 last:border-0">
                          <td className="px-4 py-3">{dateStr}</td>
                          <td className="px-4 py-3">{a.subjectId}</td>
                          <td className="px-4 py-3">{a.topic}</td>
                          <td className="px-4 py-3 capitalize">{a.difficulty}</td>
                          <td className="px-4 py-3">{a.correct}</td>
                          <td className="px-4 py-3">{a.total}</td>
                          <td className="px-4 py-3">{formatPct(a.accuracy)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
