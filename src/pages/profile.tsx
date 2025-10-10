import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-4">Загрузка...</p>;
  if (!profile) return <p className="p-4">Профиль не найден</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded-lg shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Профиль пользователя</h1>

      {/* Логин */}
      <p className="mb-4">
        <span className="font-semibold">Логин:</span> {profile.login}
      </p>

      {/* Возраст */}
      <input
        type="number"
        placeholder="Возраст"
        className="w-full border p-2 rounded mb-3"
        value={profile.age || ""}
        onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
      />

      {/* Уровень образования */}
      <input
        type="text"
        placeholder="Уровень образования"
        className="w-full border p-2 rounded mb-3"
        value={profile.educationLevel || ""}
        onChange={(e) =>
          setProfile({ ...profile, educationLevel: e.target.value })
        }
      />

      {/* Цели обучения */}
      <input
        type="text"
        placeholder="Цель обучения"
        className="w-full border p-2 rounded mb-3"
        value={profile.learningGoal || ""}
        onChange={(e) =>
          setProfile({ ...profile, learningGoal: e.target.value })
        }
      />

      {/* Стиль обучения */}
      <input
        type="text"
        placeholder="Стиль обучения"
        className="w-full border p-2 rounded mb-3"
        value={profile.learningStyle || ""}
        onChange={(e) =>
          setProfile({ ...profile, learningStyle: e.target.value })
        }
      />

      {/* Формат */}
      <input
        type="text"
        placeholder="Предпочитаемый формат (текст, видео...)"
        className="w-full border p-2 rounded mb-3"
        value={profile.preferredFormat || ""}
        onChange={(e) =>
          setProfile({ ...profile, preferredFormat: e.target.value })
        }
      />

      {/* Тон */}
      <input
        type="text"
        placeholder="Тон изложения (формальный, дружелюбный...)"
        className="w-full border p-2 rounded mb-3"
        value={profile.preferredTone || ""}
        onChange={(e) =>
          setProfile({ ...profile, preferredTone: e.target.value })
        }
      />

      {/* Детализация */}
      <input
        type="text"
        placeholder="Уровень детализации"
        className="w-full border p-2 rounded mb-3"
        value={profile.detailLevel || ""}
        onChange={(e) =>
          setProfile({ ...profile, detailLevel: e.target.value })
        }
      />

      {/* Предыдущие знания */}
      <input
        type="text"
        placeholder="Предыдущие знания"
        className="w-full border p-2 rounded mb-3"
        value={profile.priorKnowledge || ""}
        onChange={(e) =>
          setProfile({ ...profile, priorKnowledge: e.target.value })
        }
      />

      {/* Уровень языка */}
      <input
        type="text"
        placeholder="Уровень языка"
        className="w-full border p-2 rounded mb-3"
        value={profile.languageLevel || ""}
        onChange={(e) =>
          setProfile({ ...profile, languageLevel: e.target.value })
        }
      />

      {/* Предпочитаемые предметы */}
      <input
        type="text"
        placeholder="Предметы (через запятую)"
        className="w-full border p-2 rounded mb-3"
        value={profile.preferredSubjects?.join(", ") || ""}
        onChange={(e) =>
          setProfile({
            ...profile,
            preferredSubjects: e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s),
          })
        }
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}
