import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { User, Mail, BadgeCheck, ShieldAlert, Loader2, RefreshCw, Calendar } from "lucide-react";

type Me = {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setMe({
        id: Number(data.id ?? data.userId ?? 0),
        name: String(data.name ?? data.username ?? "User"),
        email: String(data.email ?? "unknown@example.com"),
        createdAt: data.createdAt ? String(data.createdAt) : undefined,
      });
    } catch (err: any) {
      setMe(null);
      setErrorMsg(err?.message || "Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0.02)} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Данные аккаунта, статус и дата регистрации.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/60 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </button>
      </motion.div>

      {/* Not auth banner */}
      {!loading && !me && (
        <motion.div
          {...fadeUp(0.04)}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300"
        >
          <div className="mb-1 flex items-center gap-2 font-medium">
            <ShieldAlert className="h-4 w-4" />
            Вы не авторизованы
          </div>
          <div>Войдите, чтобы видеть информацию профиля и сохранять результаты тестов.</div>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        {...fadeUp(0.06)}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-6 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка профиля…
          </div>
        ) : me ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-950/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-indigo-500" />
                Имя
              </div>
              <div className="text-base">{me.name}</div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-950/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-indigo-500" />
                E-mail
              </div>
              <div className="text-base">{me.email}</div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-950/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BadgeCheck className="h-4 w-4 text-indigo-500" />
                Статус
              </div>
              <div className="text-base">Аккаунт активен</div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/70 p-4 dark:border-white/10 dark:bg-gray-950/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Дата регистрации
              </div>
              <div className="text-base">
                {me.createdAt ? new Date(me.createdAt).toLocaleString() : "—"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {errorMsg ?? "Нет данных профиля."}
          </div>
        )}
      </motion.div>
    </div>
  );
}
