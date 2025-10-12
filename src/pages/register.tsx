import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { UserPlus, Loader2, Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
import { fadeVariants, trans } from "@/lib/motion";
import { useToast } from "@/lib/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useToast();

  // В схеме нет email — есть login. name опционально (если у вас он нужен на сервере — добавьте).
  const [login, setLogin] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!login || !pass1 || !pass2) {
      setErrorMsg("Заполните все поля.");
      return;
    }
    if (pass1.length < 6) {
      setErrorMsg("Пароль должен быть не короче 6 символов.");
      return;
    }
    if (pass1 !== pass2) {
      setErrorMsg("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // сервер должен ожидать login/password (по вашей схеме)
        body: JSON.stringify({ login, password: pass1 }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      notify({ type: "success", message: "Аккаунт создан! Входим…" });
      // многие проекты сразу логинят после регистрации; оставлю редирект на профиль
      router.push("/profile");
    } catch (err: any) {
      const msg = err?.message || "Не удалось создать аккаунт.";
      setErrorMsg(msg);
      notify({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Регистрация — EduAI</title>
      </Head>

      <section className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeVariants(0)}
          initial="hidden"
          animate="show"
          className="mb-6"
        >
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Регистрация</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Создайте аккаунт, чтобы сохранять попытки и получать персональные рекомендации.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: trans(0.05, 0.35) }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 shadow-soft backdrop-blur-xs dark:bg-white/5"
        >
          {/* декор */}
          <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

          {/* Login */}
          <label className="mb-1 block text-sm font-medium">Логин</label>
          <div className="relative mb-3">
            <input
              type="text"
              value={login}
              autoComplete="username"
              onChange={(e) => setLogin(e.target.value)}
              placeholder="придумайте логин (уникальный)"
              className="w-full rounded-xl border border-white/30 bg-white/70 px-9 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Password 1 */}
          <label className="mb-1 block text-sm font-medium">Пароль</label>
          <div className="relative mb-3">
            <input
              type={show1 ? "text" : "password"}
              value={pass1}
              autoComplete="new-password"
              onChange={(e) => setPass1(e.target.value)}
              placeholder="Придумайте пароль"
              className="w-full rounded-xl border border-white/30 bg-white/70 px-9 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => setShow1((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-600 transition hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label={show1 ? "Скрыть пароль" : "Показать пароль"}
            >
              {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password 2 */}
          <label className="mb-1 block text-sm font-medium">Повторите пароль</label>
          <div className="relative mb-2">
            <input
              type={show2 ? "text" : "password"}
              value={pass2}
              autoComplete="new-password"
              onChange={(e) => setPass2(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full rounded-xl border border-white/30 bg-white/70 px-9 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => setShow2((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-600 transition hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label={show2 ? "Скрыть пароль" : "Показать пароль"}
            >
              {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondaryFg transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Создаем…" : "Создать аккаунт"}
          </button>

          <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
            Уже есть аккаунт?{" "}
            <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href="/login">
              Войти
            </Link>
          </p>
        </motion.form>
      </section>
    </>
  );
}
