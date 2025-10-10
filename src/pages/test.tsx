import { useState, useEffect } from "react";

type Question = {
  question: string;
  options: string[];
  correct: string;
  tags?: string[];
};

export default function TestPage() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("md"); // ez | md | hd
  const [numQuestions, setNumQuestions] = useState(5);
  const [numOptions, setNumOptions] = useState(4);
  const [subjectId, setSubjectId] = useState<string>("free");
  const [mode, setMode] = useState<"normal" | "comfort" | "random">("normal");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; accuracy: number } | null>(null);

  const [subjects, setSubjects] = useState<any[]>([]);

  // Загружаем предметы
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch("/api/subjects");
        const data = await res.json();
        setSubjects(data.subjects || []); // ✅ берём массив из объекта
      } catch (err) {
        console.error("Failed to load subjects:", err);
        setSubjects([]);
      }
    }
    fetchSubjects();
  }, []);

  // Генерация теста
  async function handleGenerateTest() {
    if (!topic.trim()) {
      alert("Введите тему теста");
      return;
    }
    setLoading(true);
    setResult(null);
    setQuestions([]);
    setAnswers([]);

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          numQuestions,
          numOptions,
          mode,
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(""));
      } else {
        console.error("Ошибка генерации:", data.error);
      }
    } catch (err) {
      console.error("Generate test error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Выбор ответа
  function handleAnswer(questionIndex: number, option: string) {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = option;
    setAnswers(newAnswers);
  }

  // Завершение теста
  async function handleSubmitTest() {
    if (!questions.length) return;

    try {
      const res = await fetch("/api/save-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subjectId === "free" ? null : Number(subjectId),
          topic,
          difficulty,
          questions,
          answers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.test) {
        setResult({ score: data.test.score, accuracy: data.accuracy });
      } else {
        console.error("Submit test error:", data.error);
      }
    } catch (err) {
      console.error("Submit test error:", err);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded-lg shadow bg-white dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Тесты</h1>

      {/* Настройки теста */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Введите тему теста"
          className="w-full border p-2 rounded bg-white dark:bg-gray-800"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        {/* Выбор предмета */}
        <select
          className="w-full border p-2 rounded bg-white dark:bg-gray-800"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="free">Свободная тема</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.difficulty})
            </option>
          ))}
        </select>

        {/* Режим генерации */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">Режим вопросов</label>
          <select
            className="w-full border p-2 rounded bg-white dark:bg-gray-800"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="normal">Обычный (80% академично, 20% исследование)</option>
            <option value="comfort">Комфортный (100% по предпочтениям)</option>
            <option value="random">Случайный (100% случайные теги)</option>
          </select>
        </div>

        {subjectId === "free" && (
          <>
            <label className="font-medium">Сложность</label>
            <select
              className="w-full border p-2 rounded bg-white dark:bg-gray-800"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="ez">Лёгкий</option>
              <option value="md">Средний</option>
              <option value="hd">Сложный</option>
            </select>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Количество вопросов</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full border p-2 rounded bg-white dark:bg-gray-800"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Вариантов ответа в каждом</label>
            <input
              type="number"
              min={2}
              max={6}
              className="w-full border p-2 rounded bg-white dark:bg-gray-800"
              value={numOptions}
              onChange={(e) => setNumOptions(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          onClick={handleGenerateTest}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Генерация..." : "Сгенерировать тест"}
        </button>
      </div>

      {/* Вопросы */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="border p-3 rounded bg-white dark:bg-gray-800">
              <p className="font-semibold">{q.question}</p>
              <div className="space-y-1 mt-2">
                {q.options.map((opt, j) => (
                  <label key={j} className="block">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      onChange={() => handleAnswer(i, opt)}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmitTest}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Завершить тест
          </button>
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 border rounded">
          <h2 className="text-xl font-bold">Результаты</h2>
          <p>Баллы: {result.score} / {questions.length}</p>
          <p>Точность: {result.accuracy}%</p>
        </div>
      )}
    </div>
  );
}
