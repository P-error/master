import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { UserPlus, Loader2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Link from "next/link";
import { fadeUp } from "@/lib/motion";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || !email || !pass1 || !pass2) {
      setErrorMsg("Заполните все поля.");
      return;
    }
    if (pass1.length < 6) {
      setErrorMsg("Пароль должен быть не меньше 6 символов.");
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
        body: JSON.stringify({ name, email, password: pass1 }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      // после регистрации чаще всего сразу логинят → редирект
      router.push("/profile");
    } catch (err: any) {
      setErrorMsg(err?.message || "Не удалось зарегистрироваться.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <motion.div {...fadeUp(0.02)} className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Регистрация</h1>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Создайте аккаунт, чтобы сохранять попытки и видеть персональные рекомендации.
        </p>
      </motion.div>

      {/* Card */}
      <motion.form
        {...fadeUp(0.06)}
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-6 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        {/* decor */}
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

        {/* Name */}
        <label className="mb-1 block text-sm font-medium">Имя</label>
        <div className="relative mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full rounded-xl border border-white/30 bg-white/70 px-10 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
          />
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Email */}
        <label className="mb-1 block text-sm font-medium">E-mail</label>
        <div className="relative mb-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/30 bg-white/70 px-10 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
          />
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Password */}
        <label className="mb-1 block text-sm font-medium">Пароль</label>
        <div className="relative mb-3">
          <input
            type={show1 ? "text" : "password"}
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            placeholder="Минимум 6 символов"
            className="w-full rounded-xl border border-white/30 bg-white/70 px-10 py-2 pr-10 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
          />
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={() => setShow1((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Показать пароль"
          >
            {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Confirm */}
        <label className="mb-1 block text-sm font-medium">Повторите пароль</label>
        <div className="relative mb-4">
          <input
            type={show2 ? "text" : "password"}
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            placeholder="Ещё раз пароль"
            className="w-full rounded-xl border border-white/30 bg-white/70 px-10 py-2 pr-10 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-950/40"
          />
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={() => setShow2((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Показать пароль ещё раз"
          >
            {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Создаём..." : "Зарегистрироваться"}
        </button>

        <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
          Уже есть аккаунт?{" "}
          <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href="/login">
            Войти
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
