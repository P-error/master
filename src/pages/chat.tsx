import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Bot, User, Trash2 } from "lucide-react";
import { fadeUp } from "@/lib/motion";

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    toBottom();
    const t = setTimeout(toBottom, 120);
    return () => clearTimeout(t);
  }, [visibleMessages.length, loading]);

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const h = Math.min(ta.scrollHeight, 160);
    ta.style.height = h + "px";
  }, [input]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setErrorMsg(null);
    setLoading(true);
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          model: "gpt-4o-mini",
          temperature: 0.6,
          max_tokens: 600,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);

      const contentResp = (data?.content ?? "").toString();
      setMessages((prev) => [...prev, { role: "assistant", content: contentResp }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err?.message || "Request failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Извини, не удалось получить ответ. Проверь соединение и логи /api/chat (Vercel Functions).",
        },
      ]);
    } finally {
      setLoading(false);
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    setMessages([{ role: "system", content: "You are a helpful assistant." }]);
    setErrorMsg(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div {...fadeUp(0.02)} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Чат с ИИ</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Задавай вопросы по темам обучения, проси разбор решений и примеры.
          </p>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/60 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300"
          title="Очистить диалог"
        >
          <Trash2 className="h-4 w-4" />
          Очистить
        </button>
      </motion.div>

      <motion.div
        {...fadeUp(0.06)}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div ref={scrollRef} className="h-[60vh] w-full overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <AnimatePresence initial={false}>
            {visibleMessages.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400"
              >
                Спроси что-нибудь: например, <i>“Объясни теорему Байеса на примере”</i>.
              </motion.div>
            )}

            {visibleMessages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <motion.div
                  key={`${m.role}-${i}-${m.content.slice(0, 12)}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm shadow transition md:px-4 md:py-3 ${
                      isUser
                        ? "border-indigo-500/30 bg-indigo-500/10 text-gray-900 dark:text-gray-100"
                        : "border-white/20 bg-white/70 text-gray-900 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-100"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                      {isUser ? "user" : "assistant"}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </motion.div>
              );
            })}

            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-3 flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/70 px-3 py-2 text-sm text-gray-700 shadow dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Модель печатает…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mx-4 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 md:mx-6"
            >
              Ошибка: {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-white/10 bg-white/50 p-3 backdrop-blur dark:bg-gray-900/40 md:p-4">
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={5000}
                placeholder="Напиши сообщение…"
                className="max-h-40 w-full resize-none rounded-xl border border-white/20 bg-white/70 px-3 py-2 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />
              <div className="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">
                {input.length}/5000
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-110 disabled:opacity-60"
              title="Отправить"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "Отправка" : "Отправить"}
            </button>
          </form>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(0.08)}
        className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-gray-700 shadow-sm backdrop-blur dark:bg-gray-900/50 dark:text-gray-300"
      >
        Подсказка: задавайте конкретные учебные запросы, например:
        <span className="ml-1 rounded-md bg-white/70 px-2 py-0.5 font-mono text-xs dark:bg-gray-950/40">
          “Реши задачу по теореме Байеса с разбором шагов”
        </span>
        .
      </motion.div>
    </div>
  );
}
