import { useState } from "react";
import type { GeneratedTest, TestQuestion } from "./api/generate-test";
import type { TestResult } from "./api/submitTest";

export default function TestPage() {
  const [subjectId, setSubjectId] = useState<number>(1);
  const [topic, setTopic] = useState<string>("Probability basics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [numQuestions, setNumQuestions] = useState<number>(8);
  const [tags, setTags] = useState<string>("probability,bayes"); // через запятую

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  async function generateTest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topic,
          difficulty,
          numQuestions,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const test: GeneratedTest = data;
      setGenerated(test);
      setAnswers(new Array(test.questions.length).fill(-1));
    } catch (err: any) {
      setError(err?.message || "Failed to generate test");
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

  async function submitTest() {
    if (!generated) return;
    if (answers.some((a) => a < 0)) {
      setError("Ответь на все вопросы перед отправкой");
      return;
    }
    setLoading(true);
    setError(null);

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
    } catch (err: any) {
      setError(err?.message || "Failed to submit test");
    } finally {
      setLoading(false);
    }
  }

  async function saveAttempt() {
    if (!generated || !result) return;
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      setError(err?.message || "Failed to save attempt (are you logged in?)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Test</h1>

      {/* Генерация */}
      <form onSubmit={generateTest} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Subject ID</label>
          <input
            type="number"
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={subjectId}
            onChange={(e) => setSubjectId(Number(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Topic</label>
          <input
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Probability basics"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Difficulty</label>
          <select
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Questions</label>
          <input
            type="number"
            min={1}
            max={50}
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Tags (comma-separated)</label>
          <input
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="probability,bayes,entropy"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-indigo-600 text-white disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate test"}
          </button>
        </div>
      </form>

      {error && <div className="text-sm text-red-600 dark:text-red-400">Ошибка: {error}</div>}

      {/* Вопросы */}
      {generated && (
        <div className="space-y-4">
          <div className="text-sm opacity-70">
            Topic: <b>{generated.topic}</b>, Difficulty: <b>{generated.difficulty}</b>
          </div>
          {generated.questions.map((q: TestQuestion, i: number) => (
            <div key={q.id} className="border rounded-md p-4 bg-white dark:bg-gray-900">
              <div className="text-sm mb-2 opacity-70">
                Tags: {q.tags.join(", ")}
              </div>
              <div className="font-medium mb-3">
                {i + 1}. {q.question}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${
                      answers[i] === oi ? "border-indigo-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${i}`}
                      checked={answers[i] === oi}
                      onChange={() => selectAnswer(i, oi)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitTest}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className="space-y-4">
          <div className="text-lg font-semibold">
            Result: {result.correct}/{result.total} ({Math.round(result.accuracy * 100)}%)
          </div>

          <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
            <div className="font-medium mb-2">Per-tag accuracy</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(result.byTag).map(([tag, v]) => (
                <div key={tag} className="border rounded-md p-2">
                  <div className="text-sm font-medium">{tag}</div>
                  <div className="text-sm opacity-80">
                    {v.correct}/{v.total} ({Math.round(v.accuracy * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveAttempt}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save attempt"}
            </button>
            {savedId && <div className="text-sm opacity-80">Saved id: {savedId}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
