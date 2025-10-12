import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/lib/toast";

type Me = { id: number; name: string; email: string };

export default function SettingsPage() {
  const { notify } = useToast();

  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [name, setName] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const user = {
            id: Number(data.id ?? data.userId ?? 0),
            name: String(data.name ?? data.username ?? "User"),
            email: String(data.email ?? "unknown@example.com"),
          };
          setMe(user);
          setName(user.name);
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setOkMsg(null);

    if (!me) {
      const msg = "Вы не авторизованы.";
      setErrorMsg(msg);
      notify({ type: "error", title: "Ошибка", message: msg });
      return;
    }
    if (password1 && password1.length < 6) {
      const msg = "Пароль должен быть не меньше 6 символов.";
      setErrorMsg(msg);
      notify({ type: "error", title: "Ошибка", message: msg });
      return;
    }
    if (password1 && password1 !== password2) {
      const msg = "Пароли не совпадают.";
      setErrorMsg(msg);
      notify({ type: "error", title: "Ошибка", message: msg });
      return;
    }

    setSaving(true);
    try {
      const payload: any = { name };
      if (password1) payload.password = password1;

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const ok = "Настройки сохранены.";
      setOkMsg(ok);
      setPassword1("");
      setPassword2("");
      notify({ type: "success", title: "Готово", message: ok });
    } catch (err: any) {
      const msg = err?.message || "Не удалось сохранить изменения.";
      setErrorMsg(msg);
      notify({ type: "error", title: "Ошибка", message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div {...fadeUp(0.02)} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Имя профиля и смена пароля.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur dark:bg-gray-900/50">
          <SettingsIcon className="h-4 w-4 text-indigo-500" />
          <span className="text-gray-700 dark:text-gray-300">Preferences</span>
        </div>
      </motion.div>

      {authChecked && !me && (
        <motion.div
          {...fadeUp(0.04)}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300"
        >
          <div className="mb-1 font-medium">Вы не авторизованы</div>
          <div>Войдите, чтобы редактировать настройки профиля.</div>
        </motion.div>
      )}

      <motion.form
        {...fadeUp(0.06)}
        onSubmit={handleSave}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-6 shadow-sm backdrop-blur dark:bg-gray-900/50"
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <label className="mb-1 block text-sm font-medium">Имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          disabled={!me}
          className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-gray-950/40"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Новый пароль</label>
            <div className="relative">
              <input
                type={show1 ? "text" : "password"}
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Оставьте пустым, если не меняете"
                disabled={!me}
                className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 pr-10 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-gray-950/40"
              />
              <button
                type="button"
                onClick={() => setShow1((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Повторите новый пароль</label>
            <div className="relative">
              <input
                type={show2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Ещё раз новый пароль"
                disabled={!me}
                className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 pr-10 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-gray-950/40"
              />
              <button
                type="button"
                onClick={() => setShow2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}
        {okMsg && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {okMsg}
          </div>
        )}

        <div className="mt-4">
          <button
            type="submit"
            disabled={!me || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
