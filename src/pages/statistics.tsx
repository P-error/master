import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/* ---------- Типы (гибкие, нормализуем под разные схемы API) ---------- */
type RawStats = any;

type AttemptsPoint = { date: string; attempts: number };
type AccuracySlice = { name: string; value: number };
type TagBar = { tag: string; correct: number; total: number };

type NormalizedStats = {
  attemptsOverTime: AttemptsPoint[];
  accuracy: { correct: number; total: number };
  byTag: TagBar[];
};

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<RawStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setUnauthorized(false);
      setError(null);
      try {
        const urls = ["/api/statistics", "/api/stats", "/api/analytics"];
        let ok = false;
        let data: any = null;

        for (const url of urls) {
          const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }).catch(() => null as any);
          if (!res) continue;
          if (res.status === 401) {
            setUnauthorized(true);
            ok = false;
            break;
          }
          if (res.ok) {
            data = await res.json().catch(() => ({}));
            ok = true;
            break;
          }
        }

        if (!ok) {
          if (!unauthorized) throw new Error("Не удалось загрузить статистику.");
          return;
        }

        if (!alive) return;
        setRaw(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки статистики.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats: NormalizedStats | null = useMemo(() => {
    if (!raw) return null;
    return normalizeStats(raw);
  }, [raw]);

  const hasData =
    !!stats &&
    (stats.attemptsOverTime.length > 0 ||
      stats.accuracy.total > 0 ||
      stats.byTag.length > 0);

  return (
    <>
      <Head>
        <title>Statistics — EduAI</title>
      </Head>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeVariants(0)}
          initial="hidden"
          animate="show"
          className="mb-4"
        >
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Statistics
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Попытки, точность и разбивка по тегам/темам. Мобильная вёрстка,
            плавные микровзаимодействия. Контракты бэка не трогаем.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/60 px-3 py-3 text-sm dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && unauthorized && (
          <div className="rounded-2xl border border-white/10 bg-white/60 p-5 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-semibold">Sign in required</div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Войдите, чтобы посмотреть статистику.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primaryFg"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-white/10 dark:text-gray-200"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !unauthorized && error && (
          <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !unauthorized && !error && !hasData && (
          <div className="rounded-2xl border border-white/10 bg-white/60 p-5 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
            Недостаточно данных для построения графиков.
            Пройдите пару тестов — и здесь появится динамика.
          </div>
        )}

        {!loading && !unauthorized && !error && hasData && stats && (
          <div className="grid gap-3 lg:grid-cols-3">
            {/* Attempts over time */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.03, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Attempts over time</div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.attemptsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [v, "Attempts"]} />
                    <Line
                      type="monotone"
                      dataKey="attempts"
                      stroke="currentColor"
                      dot={false}
                      strokeWidth={2}
                      className="text-indigo-500"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Accuracy donut */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.05, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Accuracy</div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={toAccuracyPie(stats.accuracy)}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {toAccuracyPie(stats.accuracy).map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.name === "Correct"
                              ? "hsl(142 72% 45%)" /* emerald-500 */
                              : "hsl(0 84% 60%)" /* red-500 */
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center text-sm">
                Correct: <b>{stats.accuracy.correct}</b> / {stats.accuracy.total} (
                {stats.accuracy.total
                  ? Math.round((stats.accuracy.correct / stats.accuracy.total) * 100)
                  : 0}
                %)
              </div>
            </motion.div>

            {/* By tag */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.07, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Performance by tag</div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byTag.map((t) => ({ tag: t.tag, accuracy: pct(t.correct, t.total) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="tag" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="accuracy" className="text-indigo-500" fill="currentColor" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------- Нормализация входных данных ---------- */
function normalizeStats(raw: any): NormalizedStats {
  // Варианты контрактов, которые встречались:
  // 1) { attemptsByDay: [{ date, attempts }], accuracy: { correct, total }, byTag: [{ tag, correct, total }] }
  // 2) { attempts: [{ day, count }], accuracy: { correct, total }, tags: [{ name, correct, total }] }
  // 3) { timeline: [...], summary: {...}, tags: {...} } и т.п.
  const attemptsRaw =
    raw?.attemptsByDay ??
    raw?.attempts ??
    raw?.timeline ??
    [];
  const accuracyRaw =
    raw?.accuracy ??
    raw?.summary ??
    raw?.scores ??
    { correct: 0, total: 0 };
  const byTagRaw =
    raw?.byTag ??
    raw?.tags ??
    raw?.perTag ??
    [];

  const attemptsOverTime: AttemptsPoint[] = Array.isArray(attemptsRaw)
    ? attemptsRaw.map((p: any, i: number) => ({
        date: toDateLabel(p.date ?? p.day ?? p.label ?? i),
        attempts: toInt(p.attempts ?? p.count ?? p.value ?? 0),
      }))
    : [];

  const accuracy = {
    correct: toInt(accuracyRaw.correct ?? accuracyRaw.right ?? 0),
    total: toInt(accuracyRaw.total ?? accuracyRaw.questions ?? (accuracyRaw.right ?? 0) + (accuracyRaw.wrong ?? 0)),
  };

  const byTag: TagBar[] = Array.isArray(byTagRaw)
    ? byTagRaw.map((t: any) => ({
        tag: String(t.tag ?? t.name ?? t.label ?? "—"),
        correct: toInt(t.correct ?? t.right ?? 0),
        total: toInt(t.total ?? ((t.right ?? 0) + (t.wrong ?? 0))),
      }))
    : toTagArrayFromObject(byTagRaw);

  return { attemptsOverTime, accuracy, byTag };
}

/* ---------- Утилиты для нормализации/форматирования ---------- */
function toDateLabel(v: any): string {
  try {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toLocaleDateString();
  } catch {}
  return String(v);
}
function toInt(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}
function toTagArrayFromObject(obj: any): TagBar[] {
  if (!obj || typeof obj !== "object") return [];
  // например: { algebra: { correct,total }, geometry: {...} }
  return Object.keys(obj).map((k) => ({
    tag: k,
    correct: toInt(obj[k]?.correct ?? obj[k]?.right ?? 0),
    total: toInt(obj[k]?.total ?? ((obj[k]?.right ?? 0) + (obj[k]?.wrong ?? 0))),
  }));
}
function toAccuracyPie(a: { correct: number; total: number }): AccuracySlice[] {
  const wrong = Math.max(0, a.total - a.correct);
  const pie: AccuracySlice[] = [
    { name: "Correct", value: a.correct },
    { name: "Wrong", value: wrong },
  ];
  // если total=0 — показываем пустую диаграмму
  if (a.total === 0) return [{ name: "No data", value: 1 }];
  return pie;
}
function pct(correct: number, total: number): number {
  if (!total) return 0;
  const v = (correct / total) * 100;
  return Math.round(v);
}
