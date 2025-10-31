// src/pages/index.tsx
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type SubjectItem = {
  id: number;
  name: string;
  difficulty: Difficulty;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    generatedTests: number;
    testAttempts: number;
  };
  lastAttempt?: {
    id: number;
    createdAt: string;
    accuracy: number; // %
    total: number;
    correct: number;
  } | null;
};

type ApiListRes =
  | { ok: true; items: SubjectItem[] }
  | { error: string };

type ApiCreateRes =
  | { ok: true; subject: SubjectItem }
  | { error: string };

export default function SubjectsPage() {
  const router = useRouter();
  const [items, setItems] = useState<SubjectItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // search
  const [q, setQ] = useState("");
  const [pendingQ, setPendingQ] = useState("");

  // creation form
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // load subjects
  async function fetchSubjects(query: string = "") {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      // no-store to avoid 304 and stale lists
      const res = await fetch(`/api/subjects${qs.toString() ? `?${qs.toString()}` : ""}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
        credentials: "include",
      });
      const data: ApiListRes = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error((data as any)?.error || `Failed: ${res.status}`);
      }
      setItems(data.items);
    } catch (e: any) {
      setErr(e?.message || "Не удалось загрузить предметы");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects("");
  }, []);

  // search submit
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(pendingQ);
    fetchSubjects(pendingQ);
  };

  // create new subject
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const nm = name.trim();
    if (!nm) {
      setErr("Введите название предмета");
      return;
    }
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          name: nm,
          difficulty,
          description: description.trim() || null,
        }),
      });
      const data: ApiCreateRes = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error((data as any)?.error || `Ошибка создания: ${res.status}`);
      }
      // prepend new subject
      setItems((prev) => prev ? [data.subject, ...prev] : [data.subject]);
      // reset form
      setName("");
      setDescription("");
      setDifficulty("MEDIUM");
    } catch (e: any) {
      setErr(e?.message || "Не удалось создать предмет");
    } finally {
      setCreating(false);
    }
  }

  const hasItems = useMemo(() => (items?.length ?? 0) > 0, [items]);

  return (
    <>
      <Head>
        <title>Мои предметы</title>
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Предметы</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Создавайте предметы, запускайте тесты и отслеживайте точность по тегам.
          </p>
        </header>

        {/* Search + refresh */}
        <section className="mb-6">
          <form onSubmit={onSearch} className="flex gap-2">
            <input
              value={pendingQ}
              onChange={(e) => setPendingQ(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full rounded border px-3 py-2 outline-none focus:ring"
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              Найти
            </button>
            <button
              type="button"
              onClick={() => { setPendingQ(""); setQ(""); fetchSubjects(""); }}
              className="rounded bg-gray-100 px-4 py-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Сброс
            </button>
          </form>
        </section>

        {/* Create subject */}
        <section className="mb-10 rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">Создать предмет</h2>
          <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm">Название</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Матанализ"
                className="w-full rounded border px-3 py-2 outline-none focus:ring"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm">Сложность</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded border px-3 py-2 outline-none focus:ring"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm">Описание (опц.)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание"
                className="w-full rounded border px-3 py-2 outline-none focus:ring"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? "Создаём..." : "Создать"}
              </button>
            </div>
          </form>
        </section>

        {/* Errors */}
        {err && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
            {err}
          </div>
        )}

        {/* List */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {q ? `Результаты поиска: “${q}”` : "Мои предметы"}
            </h2>
            <button
              onClick={() => fetchSubjects(q)}
              className="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Обновить
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Загрузка…</div>
          ) : !hasItems ? (
            <div className="rounded border border-dashed p-8 text-center text-gray-500">
              Предметы не найдены. Создайте первый предмет выше.
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {items!.map((s) => (
                <li key={s.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{s.name}</h3>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                          {s.difficulty}
                        </span>
                      </div>
                      {s.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-4">
                        <div>Тестов: {s._count.generatedTests}</div>
                        <div>Попыток: {s._count.testAttempts}</div>
                        {s.lastAttempt ? (
                          <>
                            <div>Посл. точность: {s.lastAttempt.accuracy}%</div>
                            <div>
                              {s.lastAttempt.correct}/{s.lastAttempt.total}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 italic">Нет попыток</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/test?subject=${encodeURIComponent(s.id)}`)}
                        className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Начать тест
                      </button>
                      <button
                        onClick={() => router.push(`/stats/subject?subjectId=${encodeURIComponent(s.id)}`)}
                        className="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                      >
                        Статистика
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
