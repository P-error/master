import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [fontSize, setFontSize] = useState("base");

  // Загружаем настройки при открытии
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setDarkMode(data.darkMode);
          setAccessibleMode(data.accessibleMode);
          setFontSize(data.fontSize);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    fetchSettings();
  }, []);

  // Применяем настройки в DOM
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    document.body.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    document.body.classList.add(`text-${fontSize}`);

    if (accessibleMode) {
      document.body.classList.add("font-bold");
    } else {
      document.body.classList.remove("font-bold");
    }
  }, [darkMode, fontSize, accessibleMode]);

  // Сохраняем на сервер
  async function saveSettings(newSettings: Partial<{ darkMode: boolean; accessibleMode: boolean; fontSize: string }>) {
    const updated = { darkMode, accessibleMode, fontSize, ...newSettings };
    setDarkMode(updated.darkMode);
    setAccessibleMode(updated.accessibleMode);
    setFontSize(updated.fontSize);

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow bg-white dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>

      {/* Тёмная тема */}
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => saveSettings({ darkMode: e.target.checked })}
          />
          Включить тёмную тему
        </label>
      </div>

      {/* Режим для слабовидящих */}
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={accessibleMode}
            onChange={(e) => saveSettings({ accessibleMode: e.target.checked })}
          />
          Режим для слабовидящих
        </label>
      </div>

      {/* Размер шрифта */}
      <div className="mb-4">
        <label className="block mb-2">Размер шрифта:</label>
        <select
          value={fontSize}
          onChange={(e) => saveSettings({ fontSize: e.target.value })}
          className="border p-2 rounded bg-white dark:bg-gray-800"
        >
          <option value="sm">Маленький</option>
          <option value="base">Обычный</option>
          <option value="lg">Крупный</option>
          <option value="xl">Очень крупный</option>
        </select>
      </div>
    </div>
  );
}
