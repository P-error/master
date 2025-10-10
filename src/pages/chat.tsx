import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [withHistory, setWithHistory] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, withHistory }),
      });
      const data = await res.json();

      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.response }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setInput("");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Чат</h1>

      {/* Переключатель */}
      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={withHistory}
          onChange={(e) => setWithHistory(e.target.checked)}
          className="mr-2"
        />
        Использовать историю чата (последние 10 сообщений)
      </label>

      {/* Сообщения */}
      <div className="mb-4 h-96 overflow-y-auto border p-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <p>Загрузка...</p>}
      </div>

      {/* Ввод */}
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
