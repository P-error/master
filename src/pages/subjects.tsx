import { useState, useEffect } from "react";

type Subject = {
  id: number;
  name: string;
  difficulty: string;
  totalTests: number;
  accuracy: number;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState<string | null>(null);

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();

      if (res.ok) {
        setSubjects(data.subjects || []); // ✅ берём только массив subjects
      } else {
        setError(data.error || "Ошибка при загрузке предметов");
      }
    } catch (err) {
      console.error("[SubjectsPage] fetch error:", err);
      setError("Ошибка сети");
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, difficulty }),
      });

      const data = await res.json();
      if (res.ok) {
        setName("");
        setDifficulty("medium");
        fetchSubjects(); // обновляем список
      } else {
        setError(data.error || "Ошибка при создании предмета");
      }
    } catch (err) {
      console.error("[SubjectsPage] add error:", err);
      setError("Ошибка сети");
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Мои предметы</h1>

      <form onSubmit={handleAddSubject} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Название предмета"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="easy">Лёгкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Добавить
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        {subjects.map((s) => (
          <div key={s.id} className="border p-4 rounded bg-gray-50">
            <h2 className="text-lg font-semibold">{s.name}</h2>
            <p className="text-sm text-gray-700">Сложность: {s.difficulty}</p>
            <p className="text-sm text-gray-700">Тестов пройдено: {s.totalTests}</p>
            <p className="text-sm text-gray-700">Точность: {s.accuracy}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
