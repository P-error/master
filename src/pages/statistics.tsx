// src/pages/statistics.tsx
import { useEffect, useState } from "react";

type SubjectStat = {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
};

type TagStat = {
  tag: string;
  total: number;
  correct: number;
  accuracy: number;
};

type ComboStat = {
  combo: string;
  total: number;
  correct: number;
  accuracy: number;
};

type StatsPayload = {
  totalTests: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  subjectStats: SubjectStat[];
  tagStats: TagStat[];
  comboStats: ComboStat[];
};

type Recommendation = {
  type: "positive" | "negative" | "neutral";
  message: string;
};

type RecommendationsPayload = {
  summary: string;
  recommendations: Recommendation[];
};

export default function StatisticsPage() {
  const [tab, setTab] = useState<"overview" | "recommendations">("overview");
  const [data, setData] = useState<StatsPayload | null>(null);
  const [recs, setRecs] = useState<RecommendationsPayload | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/statistics");
        const json = (await res.json()) as StatsPayload;
        setData(json);
      } catch (err) {
        console.error("Failed to load statistics:", err);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === "recommendations" && !recs) {
      async function fetchRecs() {
        try {
          const res = await fetch("/api/recommendations");
          const json = (await res.json()) as RecommendationsPayload;
          setRecs(json);
        } catch (err) {
          console.error("Failed to load recommendations:", err);
        }
      }
      fetchRecs();
    }
  }, [tab, recs]);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Статистика</h1>

      {/* Вкладки */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setTab("overview")}
          className={`pb-2 ${
            tab === "overview"
              ? "border-b-2 border-blue-500 font-semibold"
              : "text-gray-500"
          }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setTab("recommendations")}
          className={`pb-2 ${
            tab === "recommendations"
              ? "border-b-2 border-blue-500 font-semibold"
              : "text-gray-500"
          }`}
        >
          Рекомендации
        </button>
      </div>

      {tab === "overview" && data && <OverviewTab data={data} />}
      {tab === "recommendations" && <RecommendationsTab recs={recs} />}
    </div>
  );
}

// --- Обзор ---
function OverviewTab({ data }: { data: StatsPayload }) {
  const allTags: string[] = Array.from(new Set(data.tagStats.map((t) => t.tag)));

  const tagAccByName = new Map(data.tagStats.map((t) => [t.tag, t.accuracy]));
  const comboAccByKey = new Map(data.comboStats.map((c) => [c.combo, c.accuracy]));

  const heatmapMatrix: Record<string, Record<string, number>> = {};
  allTags.forEach((row) => {
    heatmapMatrix[row] = {};
    allTags.forEach((col) => {
      if (row === col) {
        heatmapMatrix[row][col] = tagAccByName.get(row) ?? -1;
      } else {
        const combo = [row, col].sort().join("+");
        heatmapMatrix[row][col] = comboAccByKey.get(combo) ?? -1;
      }
    });
  });

  return (
    <>
      {/* Общие карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Тестов" value={data.totalTests} />
        <StatCard label="Вопросов" value={data.totalQuestions} />
        <StatCard label="Верных" value={data.totalCorrect} />
        <StatCard label="Точность" value={`${data.overallAccuracy}%`} />
      </div>

      <Section title="Предметы">
        <table className="w-full border">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-2 border">Предмет</th>
              <th className="p-2 border">Вопросов</th>
              <th className="p-2 border">Верных</th>
              <th className="p-2 border">Точность</th>
            </tr>
          </thead>
          <tbody>
            {data.subjectStats.map((s, i) => (
              <tr key={`${s.subject}-${i}`}>
                <td className="p-2 border">{s.subject}</td>
                <td className="p-2 border">{s.total}</td>
                <td className="p-2 border">{s.correct}</td>
                <td className="p-2 border">{s.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Теги">
        <table className="w-full border">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-2 border">Тег</th>
              <th className="p-2 border">Вопросов</th>
              <th className="p-2 border">Верных</th>
              <th className="p-2 border">Точность</th>
            </tr>
          </thead>
          <tbody>
            {data.tagStats.map((t, i) => (
              <tr key={`${t.tag}-${i}`}>
                <td className="p-2 border">{t.tag}</td>
                <td className="p-2 border">{t.total}</td>
                <td className="p-2 border">{t.correct}</td>
                <td className="p-2 border">{t.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Heatmap тегов (диагональ — одиночные теги)">
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-100 dark:bg-gray-700">#</th>
                {allTags.map((tag) => (
                  <th key={`col-${tag}`} className="p-2 border bg-gray-100 dark:bg-gray-700">
                    {tag}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTags.map((row) => (
                <tr key={`row-${row}`}>
                  <td className="p-2 border bg-gray-100 dark:bg-gray-700 font-bold">{row}</td>
                  {allTags.map((col) => {
                    const accuracy = heatmapMatrix[row][col];
                    const bgColor =
                      accuracy === -1
                        ? "bg-gray-200 dark:bg-gray-800"
                        : accuracy > 70
                        ? "bg-green-400"
                        : accuracy > 40
                        ? "bg-yellow-400"
                        : "bg-red-400";
                    return (
                      <td key={`cell-${row}-${col}`} className={`p-2 border text-center ${bgColor}`}>
                        {accuracy === -1 ? "-" : `${accuracy}%`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// --- Рекомендации ---
function RecommendationsTab({ recs }: { recs: RecommendationsPayload | null }) {
  if (!recs) return <p>Загрузка рекомендаций...</p>;

  return (
    <div>
      <p className="mb-4 font-medium">{recs.summary}</p>
      <div className="space-y-3">
        {recs.recommendations.map((rec, idx) => (
          <div
            key={idx}
            className={`p-4 rounded border ${
              rec.type === "positive"
                ? "bg-green-50 border-green-300 text-green-800"
                : rec.type === "negative"
                ? "bg-red-50 border-red-300 text-red-800"
                : "bg-gray-50 border-gray-300 text-gray-800"
            }`}
          >
            {rec.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Утилиты ---
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 border rounded shadow bg-white dark:bg-gray-800">
      <p className="text-gray-500 dark:text-gray-300">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}
