import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { AlertTriangle, Loader2, Save, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/lib/toast";

type Me = {
  id: number;
  login: string;
  age?: number | null;
  educationLevel?: string | null;
  learningGoal?: string | null;
  learningStyle?: string | null;
  preferredFormat?: string | null;
  preferredTone?: string | null;
  detailLevel?: string | null;
  priorKnowledge?: string | null;
  languageLevel?: string | null;
  darkMode?: boolean | null;
  accessibleMode?: boolean | null;
  fontSize?: string | null;
  [k: string]: any;
};

export default function SettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { notify } = useToast();

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState<Me | null>(null);
  const [saving, setSaving] = useState(false);

  // load current profile to prefill
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setUnauthorized(false);
      setError(null);
      try {
        const urls = ["/api/me", "/api/profile", "/api/user"];
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
          if (!unauthorized) throw new Error("Не удалось загрузить профиль.");
          return;
        }
        const u: Me = (data?.user ?? data) as Me;
        if (!alive) return;
        // Prefill form
        setForm({
          ...u,
          fontSize: u.fontSize ?? "base",
          darkMode: !!u.darkMode,
          accessibleMode: !!u.accessibleMode,
        });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки профиля.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const payload = {
        // отправляем только ожидаемые поля профиля/настроек
        age: numOrNull(form.age),
        educationLevel: emptyToNull(form.educationLevel),
        learningGoal: emptyToNull(form.learningGoal),
        learningStyle: emptyToNull(form.learningStyle),
        preferredFormat: emptyToNull(form.preferredFormat),
        preferredTone: emptyToNull(form.preferredTone),
        detailLevel: emptyToNull(form.detailLevel),
        priorKnowledge: emptyToNull(form.priorKnowledge),
        languageLevel: emptyToNull(form.languageLevel),
        darkMode: !!form.darkMode,
        accessibleMode: !!form.accessibleMode,
        fontSize: form.fontSize || "base",
      };

      // первый успешный PATCH/PUT — победил
      const urls: Array<[string, string]> = [
        ["/api/profile", "PATCH"],
        ["/api/profile", "PUT"],
        ["/api/user", "PATCH"],
        ["/api/user", "PUT"],
        ["/api/settings", "PATCH"],
        ["/api/settings", "PUT"],
      ];

      let ok = false;
      for (const [url, method] of urls) {
        const res = await fetch(url, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null as any);
        if (!res) continue;
        if (res.status === 401) {
          setUnauthorized(true);
          ok = false;
          break;
        }
        if (res.ok) {
          ok = true;
          break;
        }
      }

      if (!ok) throw new Error("Не удалось сохранить настройки.");

      // синхронизируем тему UI сразу (если пользователь щёлкнул)
      setTheme(form.darkMode ? "dark" : "light");

      notify({ type: "success", message: "Настройки сохранены." });
      router.push("/profile");
    } catch (e: any) {
      notify({ type: "error", message: e?.message || "Ошибка сохранения." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Settings — EduAI</title>
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Предпочтения обучения и отображения. Все поля — опциональны.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/60 px-3 py-3 text-sm dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && unauthorized && (
          <div className="rounded-2xl border border-white/10 bg-white/60 p-5 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-semibold">Sign in required</div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Войдите, чтобы менять настройки.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !unauthorized && error && (
          <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !unauthorized && !error && form && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: trans(0.04, 0.35) }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 shadow-soft backdrop-blur-xs dark:bg-white/5"
          >
            <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

            {/* Learning block */}
            <div className="mb-3 text-sm font-semibold">Learning profile</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Age"
                value={form.age ?? ""}
                onChange={(v) => setForm({ ...form, age: v === "" ? null : Number(v) })}
              />
              <TextField label="Education level" value={form.educationLevel ?? ""} onChange={(v) => setForm({ ...form, educationLevel: v })} />
              <TextField label="Goal" value={form.learningGoal ?? ""} onChange={(v) => setForm({ ...form, learningGoal: v })} />
              <TextField label="Style" value={form.learningStyle ?? ""} onChange={(v) => setForm({ ...form, learningStyle: v })} />
              <TextField label="Preferred format" value={form.preferredFormat ?? ""} onChange={(v) => setForm({ ...form, preferredFormat: v })} />
              <TextField label="Preferred tone" value={form.preferredTone ?? ""} onChange={(v) => setForm({ ...form, preferredTone: v })} />
              <TextField label="Detail level" value={form.detailLevel ?? ""} onChange={(v) => setForm({ ...form, detailLevel: v })} />
              <TextField label="Prior knowledge" value={form.priorKnowledge ?? ""} onChange={(v) => setForm({ ...form, priorKnowledge: v })} />
              <TextField label="Language level" value={form.languageLevel ?? ""} onChange={(v) => setForm({ ...form, languageLevel: v })} />
            </div>

            {/* Display block */}
            <div className="mt-6 mb-3 text-sm font-semibold">Display</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SwitchField
                label="Dark mode"
                checked={!!form.darkMode}
                onChange={(v) => setForm({ ...form, darkMode: v })}
              />
              <SwitchField
                label="Accessible mode"
                checked={!!form.accessibleMode}
                onChange={(v) => setForm({ ...form, accessibleMode: v })}
              />
              <SelectField
                label="Font size"
                value={form.fontSize ?? "base"}
                onChange={(v) => setForm({ ...form, fontSize: v })}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "base", label: "Base" },
                  { value: "lg", label: "Large" },
                ]}
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primaryFg transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </motion.div>
        )}
      </section>
    </>
  );
}

/* ---------- tiny field components (внутри страницы, без доп. файлов) ---------- */

function TextField({
  label,
  value,
  onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
        className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: { label: string; value: number | string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={0}
        className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
      />
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-white/10">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${
          checked ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
      >
        {options.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ---------- utils ---------- */
function emptyToNull(v?: string | null) {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}
function numOrNull(v: any) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
