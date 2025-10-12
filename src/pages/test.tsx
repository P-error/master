import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestTube, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { fadeUp } from "@/lib/motion";
import { useToast } from "@/lib/toast";

type Difficulty = "easy" | "medium" | "hard";

type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  tags: string[];
  difficulty: Difficulty;
  topic: string;
  subjectId: number;
};

type GeneratedTest = {
  subjectId: number;
  topic: string;
  difficulty: Difficulty;
  questions: TestQuestion[];
};

type TestResult = {
  total: number;
  correct: number;
  accuracy: number;
  byTag: { [tag: string]: { total: number; correct: number; accuracy: number } };
  byQuestion: { id: string; correct: boolean; expected: number; got: number }[];
};

export default function TestPage() {
  const router = useRouter();
  const { notify } = useToast();

  const [subjectId, setSubjectId] = useState<number>(1);
  const [topic, setTopic] = useState<string>("Probability basics");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState<number>(8);
  const [tagsInput, setTagsInput] = useState<string>("probability,bayes");

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  // Прочитаем query при первом рендере и подставим значения
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    if (q.subjectId) setSubjectId(Number(q.subjectId));
    if (typeof q.topic === "string" && q.topic.trim()) setTopic(q.topic);
    if (q.difficulty && ["easy", "medium", "hard"].includes(String(q.difficulty))) {
      setDifficulty(q.difficulty as Difficulty);
    }
    if (q.numQuestions) setNumQuestions(Math.min(50, Math.max(1, Number(q.numQuestions))));
    if (typeof q.tags === "string" && q.tags.trim()) setTagsInput(q.tags);
  }, [router.isReady]);

  const tags = useMemo(
    () => tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    [tagsInput]
  );

  useEffect(() => setSavedId(null), [result]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setGenerated(null);
    setAnswers([]);
    setResult(null);
    setSavedId(null);

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, topic, difficulty, numQuestions, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const test: GeneratedTest = data;
      setGenerated(test);
      setAnswers(new Array(test.questions.length).fill(-1));
      notify({ type: "success", title: "Готово", message: "Тест сгенерирован" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to generate test");
      notify({ type: "error", title: "Ошибка", message: "Не удалось сгенерировать тест" });
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex: number, optIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  }

  async function handleSubmit() {
    if (!generated) return;
    if (answers.some((a) => a < 0)) {
      setErrorMsg("Ответь на все вопросы перед отправкой");
      notify({ type: "info", message: "Ответьте на все вопросы" });
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/submitTest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: generated.subjectId,
          topic: generated.topic,
          difficulty: generated.difficulty,
          questions: generated.questions,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setResult(data as TestResult);
      notify({ type: "success", title: "Отправлено", message: "Получен разбор результатов" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit test");
      notify({ type: "error", title: "Ошибка", message: "Отправка не удалась" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!generated || !result) return;
    setLoading(true);
    setErrorMsg(null);
    setSavedId(null);

    try {
      const res = await fetch("/api/save-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: generated.subjectId,
          topic: generated.topic,
          difficulty: generated.difficulty,
          questions: generated.questions,
          answers,
          result,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSavedId(data.id);
      notify({ type: "success", title: "Сохранено", message: "Попытка сохранена" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save attempt (are you logged in?)");
      notify({ type: "error", title: "Ошибка", message: "Сохранить не удалось" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div {...fadeUp(0.02)} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Генератор тестов</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Сформируй тест под тему и сложность, пройди и получи разбор по тематикам.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur dark:bg-gray-900/50">
          <TestTube className="h-4 w-4 text-indigo-500" />
          <span className="text-gray-700 dark:text-gray-300">Adaptive</span>
        </div>
      </motion.div>

      <motion.form
        {...fadeUp(0.06)}
        onSubmit={handleGenerate}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Subject ID</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-white/30 bg-white/70 px-3 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-950/40"
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Topic</label>
            <input
              className="w-full rounded-lg border border-white/30 bg-white/70 px-3 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-950/40"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Probability basics"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Difficulty</label>
            <select
              className="w-full rounded-lg border border-white/30 bg-white/70 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-950/40"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Questions</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full rounded-lg border border-white/30 bg-white/70 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-950/40"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
            <input
              className="w-full rounded-lg border border-white/30 bg-white/70 px-3 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-950/40"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="probability,bayes,entropy"
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Например: <code>probability,bayes,entropy</code>. Теги влияют на разбор.
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Генерация..." : "Сгенерировать тест"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            Ошибка: {errorMsg}
          </div>
        )}
      </motion.form>

      <AnimatePresence>
        {generated && (
          <motion.section
            key="questions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Topic: <b>{generated.topic}</b> · Difficulty:{" "}
              <b className="capitalize">{generated.difficulty}</b>
            </div>

            {generated.questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 backdrop-blur dark:bg-gray-900/50"
              >
                <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />
                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tags: {q.tags.join(", ")}
                </div>
                <div className="mb-3 text-base font-medium">
                  {i + 1}. {q.question}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[i] === oi;
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition ${
                          selected
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-white/20 hover:bg-white/60 dark:hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-0.5"
                          name={`q_${i}`}
                          checked={selected}
                          onChange={() => selectAnswer(i, oi)}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:brightness-110 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Отправка..." : "Отправить тест"}
              </button>

              <Link
                href="/chat"
                className="inline-flex items-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                Обсудить в чате
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 backdrop-blur dark:bg-gray-900/50">
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="text-lg font-semibold">
                Результат: {result.correct}/{result.total} ({Math.round(result.accuracy * 100)}%)
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Нажми «Сохранить попытку», чтобы увидеть прогресс в статистике.
              </p>
              <div className="mt-3">
                <div className="font-medium">Точность по тегам</div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {Object.entries(result.byTag).map(([tag, v]) => (
                    <div key={tag} className="rounded-xl border border-white/20 px-3 py-2">
                      <div className="text-sm font-medium">{tag}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {v.correct}/{v.total} ({Math.round(v.accuracy * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:brightness-110 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Сохранение..." : "Сохранить попытку"}
                </button>
                {savedId && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Сохранено (id: {savedId}). Перейти в{" "}
                    <Link className="underline" href="/statistics">Statistics</Link>.
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
