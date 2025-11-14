// src/pages/statistics.tsx
import Head from "next/head";
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  PieChart as PieIcon,
  TrendingUp,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#e11d48"];

type SubjectStat = {
  subjectId: number | null;
  subjectName: string;
  attempts: number;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number; // 0..1
};

type TagStat = {
  tag: string;
  total: number;
  correct: number;
  accuracy: number; // 0..1
};

type TimelinePoint = {
  id: number;
  subjectId: number | null;
  subjectName: string;
  createdAt: string;
  accuracy: number; // 0..1
};

type RawStats = {
  totalTests: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  subjectStats: SubjectStat[];
  tagStats: TagStat[];
  timeline: TimelinePoint[];
};

type NormalizedStats = RawStats;

type RecItem =
  | { type: "positive"; message: string }
  | { type: "negative"; message: string }
  | { type: "neutral"; message: string };

type RecResponse = {
  summary: string;
  recommendations: RecItem[];
};

function normalizeStats(raw: RawStats): NormalizedStats {
  return {
    ...raw,
    subjectStats: raw.subjectStats ?? [],
    tagStats: raw.tagStats ?? [],
    timeline: (raw.timeline ?? []).slice().sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }),
  };
}

export default function StatisticsPage() {
  const [view, setView] = useState<"stats" | "recs">("stats");

  const [raw, setRaw] = useState<RawStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recs, setRecs] = useState<RecResponse | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [timelineRange, setTimelineRange] = useState<"all" | "last10" | "last30">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Загружаем статистику
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setUnauthorized(false);
      setError(null);
      try {
        const res = await fetch("/api/statistics", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.status === 401) {
          if (!alive) return;
          setUnauthorized(true);
          return;
        }
        if (!res.ok) {
          throw new Error("Не удалось загрузить статистику.");
        }

        const data = (await res.json()) as RawStats;
        if (!alive) return;
        setRaw(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки статистики.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = true;
    };
  }, []);

  // Загружаем рекомендации, когда переходим на вкладку "Рекомендации"
  useEffect(() => {
    if (view !== "recs") return;
    if (unauthorized) return;

    let cancelled = false;

    setRecsLoading(true);
    setRecsError(null);

    (async () => {
      try {
        const res = await fetch("/api/recommendations", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;

        if (res.status === 401) {
          setRecsError("Требуется вход.");
          return;
        }

        if (!res.ok) {
          throw new Error("Не удалось загрузить рекомендации.");
        }

        const data = await res.json();

        if (cancelled) return;

        // Проверяем, что это именно наш формат { summary, recommendations }
        if ("summary" in data && "recommendations" in data) {
          setRecs(data as RecResponse);
        } else {
          const msg =
            (data as any)?.error ||
            "Сервер вернул неожиданный формат данных.";
          setRecsError(msg);
        }
      } catch (e: any) {
        if (cancelled) return;
        setRecsError(e?.message || "Ошибка загрузки рекомендаций.");
      } finally {
        if (!cancelled) {
          setRecsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, unauthorized]); // важный момент: не зависим от recs/recsLoading

  const stats: NormalizedStats | null = useMemo(() => {
    if (!raw) return null;
    return normalizeStats(raw);
  }, [raw]);

  const subjectOptions = useMemo(() => {
    if (!stats) return [];
    const seen = new Set<string>();
    const result: { key: string; label: string }[] = [];
    for (const s of stats.subjectStats) {
      const key = s.subjectId === null ? "none" : String(s.subjectId);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ key, label: s.subjectName });
    }
    return result;
  }, [stats]);

  const filteredTimeline = useMemo(() => {
    if (!stats) return [];
    let data = stats.timeline;
    if (subjectFilter !== "all") {
      data = data.filter((p) => {
        const key = p.subjectId === null ? "none" : String(p.subjectId);
        return key === subjectFilter;
      });
    }
    if (timelineRange === "last10") {
      return data.slice(-10);
    }
    if (timelineRange === "last30") {
      return data.slice(-30);
    }
    return data;
  }, [stats, subjectFilter, timelineRange]);

  const filteredSubjectStats = useMemo(() => {
    if (!stats) return [];
    if (subjectFilter === "all") return stats.subjectStats;
    return stats.subjectStats.filter((s) => {
      const key = s.subjectId === null ? "none" : String(s.subjectId);
      return key === subjectFilter;
    });
  }, [stats, subjectFilter]);

  const hasData =
    !!stats &&
    (stats.totalTests > 0 ||
      stats.totalQuestions > 0 ||
      stats.subjectStats.length > 0 ||
      stats.tagStats.length > 0 ||
      stats.timeline.length > 0);

  const pieData =
    stats && stats.totalQuestions > 0
      ? [
          { name: "Верно", value: stats.totalCorrect },
          {
            name: "Неверно",
            value: Math.max(0, stats.totalQuestions - stats.totalCorrect),
          },
        ]
      : [{ name: "Нет данных", value: 1 }];

  const bestSubjects =
    stats && stats.subjectStats.length > 0
      ? [...stats.subjectStats].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3)
      : [];

  const weakTags =
    stats && stats.tagStats.length > 0
      ? [...stats.tagStats]
          .filter((t) => t.total >= 3)
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 5)
      : [];

  const negativeRecs = useMemo(
    () => (recs ? recs.recommendations.filter((r) => r.type === "negative") : []),
    [recs],
  );

  const neutralRecs = useMemo(
    () => (recs ? recs.recommendations.filter((r) => r.type === "neutral") : []),
    [recs],
  );

  const positiveRecs = useMemo(
    () => (recs ? recs.recommendations.filter((r) => r.type === "positive") : []),
    [recs],
  );

  return (
    <>
      <Head>
        <title>Статистика и рекомендации • DissertAssist</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-6 md:pt-10">
          {/* Header */}
          <motion.header
            variants={fadeVariants(0)}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
          >
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Прогресс и рекомендации
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Здесь ты видишь, как идёт обучение: общая точность, сильные и слабые стороны, а также текстовые
                подсказки.
              </p>
            </div>

            {/* Tabs */}
            <div className="inline-flex items-center rounded-full bg-slate-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setView("stats")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  view === "stats"
                    ? "bg-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Статистика
              </button>
              <button
                type="button"
                onClick={() => setView("recs")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  view === "recs"
                    ? "bg-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Рекомендации
              </button>
            </div>
          </motion.header>

          {/* Авторизация */}
          {unauthorized && (
            <motion.div
              variants={fadeVariants(0.05)}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-slate-200"
            >
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="font-medium">Требуется вход</span>
              </div>
              <p className="text-xs text-slate-400">
                Статистика и рекомендации доступны только авторизованным пользователям. Войдите в аккаунт, чтобы
                увидеть анализ своих попыток.
              </p>
            </motion.div>
          )}

          {/* Ошибка статистики */}
          {!loading && !unauthorized && error && view === "stats" && (
            <motion.div
              variants={fadeVariants(0.05)}
              initial="hidden"
              animate="show"
              className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <div className="font-medium">Ошибка</div>
                <p className="text-xs text-red-100/80">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Вьюха: Статистика */}
          {view === "stats" && !unauthorized && (
            <>
              {loading && (
                <motion.section
                  variants={fadeVariants(0.05)}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 md:grid-cols-4"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-2xl border border-slate-800 bg-slate-900/80 animate-pulse"
                    />
                  ))}
                </motion.section>
              )}

              {!loading && !error && !stats && (
                <motion.div
                  variants={fadeVariants(0.05)}
                  initial="hidden"
                  animate="show"
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-5 text-sm text-slate-300"
                >
                  Пока нет данных для статистики. Пройди несколько тестов — и здесь появится твой прогресс.
                </motion.div>
              )}

              {!loading && !error && stats && hasData && (
                <motion.section
                  variants={fadeVariants(0.05)}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-6"
                >
                  {/* Summary cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                      icon={BarChart3}
                      label="Всего тестов"
                      value={stats.totalTests.toString()}
                      helper={stats.totalTests > 0 ? "История попыток сохранена" : "Пока нет попыток"}
                    />
                    <SummaryCard
                      icon={PieIcon}
                      label="Всего вопросов"
                      value={stats.totalQuestions.toString()}
                      helper={`Верно: ${stats.totalCorrect} • Неверно: ${
                        Math.max(0, stats.totalQuestions - stats.totalCorrect)
                      }`}
                    />
                    <SummaryCard
                      icon={TrendingUp}
                      label="Общая точность"
                      value={`${Math.round((stats.overallAccuracy ?? 0) * 100)}%`}
                      helper={
                        bestSubjects.length > 0
                          ? `Лучший предмет: ${bestSubjects[0].subjectName} (${Math.round(
                              bestSubjects[0].accuracy * 100,
                            )}%)`
                          : "На основе всех ответов"
                      }
                    />
                    <SummaryCard
                      icon={AlertTriangle}
                      label="Слабые теги"
                      value={
                        weakTags.length > 0
                          ? weakTags
                              .slice(0, 2)
                              .map((t) => t.tag)
                              .join(", ")
                          : "нет явных слабых мест"
                      }
                      helper={
                        weakTags.length > 0
                          ? "Анализ по тегам с достаточным количеством вопросов"
                          : "Продолжай решать задания — система найдёт слабые места"
                      }
                    />
                  </div>

                  {/* Charts grid */}
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Timeline */}
                    <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-indigo-400" />
                          <h2 className="text-sm font-semibold text-slate-100">
                            Динамика точности по попыткам
                          </h2>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-[11px] text-slate-400">
                            Точки — отдельные попытки; можно фильтровать по предмету и диапазону
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={subjectFilter}
                              onChange={(e) => setSubjectFilter(e.target.value)}
                              className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100"
                            >
                              <option value="all">Все предметы</option>
                              {subjectOptions.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-1 rounded-full bg-slate-900/80 p-1 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setTimelineRange("all")}
                                className={`rounded-full px-2 py-0.5 ${
                                  timelineRange === "all"
                                    ? "bg-slate-700 text-slate-100"
                                    : "text-slate-400 hover:text-slate-100"
                                }`}
                              >
                                Всё время
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimelineRange("last10")}
                                className={`rounded-full px-2 py-0.5 ${
                                  timelineRange === "last10"
                                    ? "bg-slate-700 text-slate-100"
                                    : "text-slate-400 hover:text-slate-100"
                                }`}
                              >
                                10 попыток
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimelineRange("last30")}
                                className={`rounded-full px-2 py-0.5 ${
                                  timelineRange === "last30"
                                    ? "bg-slate-700 text-slate-100"
                                    : "text-slate-400 hover:text-slate-100"
                                }`}
                              >
                                30 попыток
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-64">
                        {filteredTimeline.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-xs text-slate-500">
                            Недостаточно данных для выбранного фильтра
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredTimeline}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis
                                dataKey="createdAt"
                                tickFormatter={(v) =>
                                  new Date(v).toLocaleDateString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })
                                }
                                tickMargin={8}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                              />
                              <YAxis
                                domain={[0, 1]}
                                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                              />
                              <Tooltip
                                formatter={(value: any) => `${pct(value)}%`}
                                labelFormatter={(label: any, payload: any) => {
                                  const p = payload && payload[0];
                                  const subj = p?.payload?.subjectName;
                                  const date = new Date(label).toLocaleString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                                  return subj ? `${subj} • ${date}` : date;
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="#4f46e5"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Pie chart */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PieIcon className="h-4 w-4 text-emerald-400" />
                          <h2 className="text-sm font-semibold text-slate-100">
                            Распределение ответов
                          </h2>
                        </div>
                        <span className="text-xs text-slate-400">
                          На основе всех попыток
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              dataKey="value"
                              data={pieData}
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={4}
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.name === "Верно"
                                      ? "#22c55e"
                                      : entry.name === "Неверно"
                                      ? "#ef4444"
                                      : "#6b7280"
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any) =>
                                name === "Верно" || name === "Неверно"
                                  ? `${value} (${pct(
                                      name === "Верно"
                                        ? stats?.totalQuestions
                                          ? stats.totalCorrect / stats.totalQuestions
                                          : 0
                                        : stats?.totalQuestions
                                        ? (stats.totalQuestions - stats.totalCorrect) /
                                          stats.totalQuestions
                                        : 0,
                                    )}%)`
                                  : value
                              }
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Subject and tag stats */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Subjects */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-sky-400" />
                          <h2 className="text-sm font-semibold text-slate-100">
                            Точность по предметам
                          </h2>
                        </div>
                        <span className="text-xs text-slate-400">
                          Сортировка по числу вопросов
                        </span>
                      </div>
                      <div className="h-64">
                        {filteredSubjectStats.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-xs text-slate-500">
                            Пока нет попыток с привязкой к предметам
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredSubjectStats}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis
                                dataKey="subjectName"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                interval={0}
                                tickMargin={8}
                              />
                              <YAxis
                                domain={[0, 1]}
                                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                              />
                              <Tooltip
                                formatter={(value: any) => `${pct(value)}%`}
                                labelFormatter={(label: any) => label}
                              />
                              <Bar dataKey="accuracy">
                                {filteredSubjectStats.map((_, idx) => (
                                  <Cell
                                    key={`subject-${idx}`}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-pink-400" />
                          <h2 className="text-sm font-semibold text-slate-100">
                            Теги: сильные и слабые стороны
                          </h2>
                        </div>
                        <span className="text-xs text-slate-400">
                          Нужны хотя бы 3 вопроса на тег
                        </span>
                      </div>

                      {weakTags.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/80 px-3 py-3 text-xs text-slate-400">
                          Пока недостаточно данных по тегам. Решай задания — и здесь появится анализ, какие типы
                          вопросов даются легче, а какие сложнее.
                        </div>
                      )}

                      {weakTags.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="mb-1 text-xs font-semibold text-red-300">
                              Слабые теги
                            </div>
                            <div className="flex flex-col gap-1">
                              {weakTags.map((t) => (
                                <div
                                  key={t.tag}
                                  className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-1.5"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-red-100">
                                      {t.tag}
                                    </span>
                                    <span className="text-[11px] text-red-200/80">
                                      Вопросов: {t.total}, верных: {t.correct}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-red-300">
                                    {pct(t.accuracy)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500">
                            Полная статистика по тегам строится по накопленным данным из всех тестов. Чем больше ты
                            решаешь — тем точнее становится анализ.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </>
          )}

          {/* Вьюха: Рекомендации */}
          {view === "recs" && !unauthorized && (
            <motion.section
              variants={fadeVariants(0.05)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              {recsLoading && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Загружаем рекомендации...</span>
                </div>
              )}

              {!recsLoading && recsError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-medium">Ошибка рекомендаций</div>
                    <p className="text-xs text-red-100/80">{recsError}</p>
                  </div>
                </div>
              )}

              {!recsLoading && !recsError && recs && (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
                    <div className="mb-1 flex items-center gap-2">
                      <Info className="h-4 w-4 text-sky-400" />
                      <span className="font-medium">Итоговая сводка</span>
                    </div>
                    <p className="text-xs text-slate-300">{recs.summary}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {negativeRecs.map((r, idx) => (
                      <RecCard key={`neg-${idx}`} item={r} />
                    ))}
                    {neutralRecs.map((r, idx) => (
                      <RecCard key={`neu-${idx}`} item={r} />
                    ))}
                    {positiveRecs.map((r, idx) => (
                      <RecCard key={`pos-${idx}`} item={r} />
                    ))}
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Рекомендации строятся по данным о твоих попытках (точность ответов, статистика по тегам и
                    предметам). По мере появления новых тестов советы будут обновляться.
                  </p>
                </>
              )}

              {!recsLoading && !recsError && !recs && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
                  Пока нет данных для рекомендаций. Пройди хотя бы один тест — и здесь появится анализ твоих
                  сильных и слабых сторон.
                </div>
              )}
            </motion.section>
          )}
        </div>
      </main>
    </>
  );
}

type SummaryCardProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  helper?: string;
};

function SummaryCard({ icon: Icon, label, value, helper }: SummaryCardProps) {
  return (
    <motion.div
      variants={fadeVariants(0.05)}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-400">{label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            {value}
          </div>
          {helper && (
            <div className="mt-1 text-[11px] text-slate-500">{helper}</div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
          <Icon className="h-5 w-5 text-slate-100" />
        </div>
      </div>
    </motion.div>
  );
}

function pct(v: number | null | undefined): number {
  if (!v || !isFinite(v)) return 0;
  return Math.round(v * 100);
}

function RecCard({ item }: { item: RecItem }) {
  let border = "border-slate-700";
  let bg = "bg-slate-900/80";
  let iconColor = "text-slate-200";
  let label = "Общее замечание";

  if (item.type === "positive") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-500/10";
    iconColor = "text-emerald-400";
    label = "Позитивный сигнал";
  } else if (item.type === "negative") {
    border = "border-red-500/40";
    bg = "bg-red-500/10";
    iconColor = "text-red-400";
    label = "Зона роста";
  } else {
    border = "border-slate-700/80";
    bg = "bg-slate-900/80";
    iconColor = "text-slate-300";
    label = "Нейтральное замечание";
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${border} ${bg}`}
    >
      <div className="flex items-center gap-2">
        {item.type === "positive" ? (
          <CheckCircle2 className={`h-4 w-4 ${iconColor}`} />
        ) : item.type === "negative" ? (
          <AlertTriangle className={`h-4 w-4 ${iconColor}`} />
        ) : (
          <Info className={`h-4 w-4 ${iconColor}`} />
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
          {label}
        </span>
      </div>
      <p className="text-xs text-slate-100">{item.message}</p>
    </div>
  );
}
