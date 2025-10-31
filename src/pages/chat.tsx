import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { Loader2, SendHorizontal, AlertTriangle } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import TypingDots from "@/components/TypingDots";

type Role = "user" | "assistant" | "system";
type Msg = { id: string; role: Role; content: string; createdAt?: string };

export default function ChatPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  // автоскролл к последнему сообщению
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, assistantTyping]);

  // загрузка истории
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);
      try {
        const urls = [
          "/api/chat/history",
          "/api/chat/messages",
          "/api/messages",
          "/api/chat", // GET может отдавать последние сообщения
        ];
        let ok = false;
        let data: any = null;

        for (const url of urls) {
          const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }).catch(() => null as any);

          if (!res) continue;
          if (res.status === 401) {
            setUnauthorized(true);
            ok = false;
            break;
          }
          if (res.ok) {
            data = await res.json().catch(() => ({}));
            ok = true;
            break;
          }
        }

        if (!ok) {
          if (!unauthorized) throw new Error("Не удалось загрузить историю.");
          return;
        }

        const list: Msg[] = normalizeHistory(data);
        if (!alive) return;
        setMessages(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: Msg = {
      id: "u-" + Date.now().toString(36),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setAssistantTyping(true);
    setSending(true);

    try {
      // Собираем компактную историю (можно урезать до 12 последних)
      const history = toPayloadHistory([...messages, userMsg]).slice(-12);

      const urls = [
        "/api/chat",
        "/api/chat/send",
        "/api/messages",
        "/api/ask",
      ];

      let ok = false;
      let data: any = null;
      for (const url of urls) {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        }).catch(() => null as any);

        if (!res) continue;
        if (res.status === 401) {
          setUnauthorized(true);
          ok = false;
          break;
        }
        if (res.ok) {
          data = await res.json().catch(() => ({}));
          ok = true;
          break;
        }
      }

      if (!ok) {
        throw new Error(unauthorized ? "Требуется вход." : "Не удалось отправить сообщение.");
      }

      const assistantMsg = normalizeAssistant(data);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e?.message || "Ошибка отправки.");
      // откат ввода, если нужно:
      // setInput(text);
    } finally {
      setAssistantTyping(false);
      setSending(false);
    }
  }

  const showEmpty = useMemo(() => !loading && !error && !unauthorized && messages.length === 0, [loading, error, unauthorized, messages]);

  return (
    <>
      <Head>
        <title>Чат — EduAI</title>
      </Head>

      <section className="mx-auto flex h-[calc(100dvh-9rem)] max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Чат с EduAI</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Задавайте вопросы по предметам — ассистент отвечает по шагам.
          </p>
        </motion.div>

        {/* Список сообщений */}
        <div
          ref={listRef}
          className="relative flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/60 p-3 shadow-soft dark:bg-white/5"
        >
          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-3 text-sm dark:bg-white/5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка…
            </div>
          )}

          {!loading && unauthorized && (
            <div className="rounded-2xl border border-white/10 bg-white/60 p-5 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <div className="text-sm font-semibold">Требуется вход</div>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Войдите, чтобы пользоваться чатом.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href="/login" className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primaryFg">
                      Войти
                    </a>
                    <a
                      href="/register"
                      className="rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-white/10 dark:text-gray-200"
                    >
                      Создать аккаунт
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !unauthorized && error && (
            <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {showEmpty && (
            <div className="rounded-xl bg-white/70 p-4 text-sm text-gray-700 dark:bg-white/10 dark:text-gray-300">
              Нет сообщений. Напишите вопрос внизу, например: <em>“Объясни теорему Пифагора по шагам.”</em>
            </div>
          )}

          {!loading && !unauthorized && !error && messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((m) => (
                <ChatMessage key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
              ))}
              {assistantTyping && <TypingDots />}
            </div>
          )}
        </div>

        {/* Композер */}
        <div className="sticky bottom-0 z-10 mt-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-2 shadow-soft backdrop-blur-xs dark:bg-white/5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={unauthorized || sending}
              placeholder="Напишите сообщение… (Ctrl/⌘ + Enter — отправить)"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/20 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
            />

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Подсказка: спрашивайте “почему” и “покажи пример”.
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={unauthorized || sending || !input.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primaryFg transition hover:opacity-90 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                {sending ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Нормализация разных форматов истории */
function normalizeHistory(raw: any): Msg[] {
  // Варианты:
  // - [{ id, role, content, createdAt }]
  // - { messages: [...] }
  // - { history: [...] }
  const arr = Array.isArray(raw) ? raw : raw?.messages ?? raw?.history ?? [];
  return (arr as any[]).map((m, i) => ({
    id: String(m.id ?? `м-${i}`),
    role: (m.role ?? "assistant") as Role,
    content: String(m.content ?? m.text ?? ""),
    createdAt: m.createdAt ?? undefined,
  }));
}

function toPayloadHistory(list: Msg[]) {
  return list.map((m) => ({ role: m.role, content: m.content }));
}

/** Нормализация ответа ассистента */
function normalizeAssistant(raw: any): Msg {
  // Возможные формы:
  // - { id, role, content }
  // - { message: { role, content } }
  // - { reply: "text" }
  const m = raw?.message ?? raw?.data ?? raw;
  const content = m?.content ?? m?.reply ?? raw?.reply ?? "";
  return {
    id: "a-" + Date.now().toString(36),
    role: "assistant",
    content: String(content),
    createdAt: new Date().toISOString(),
  };
}
