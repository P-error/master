import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";
import { AlertTriangle, Loader2, Settings, User } from "lucide-react";

type UserProfile = {
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
  createdAt?: string;
  updatedAt?: string;
  // допускаем любые доп. поля
  [k: string]: any;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setUnauthorized(false);
      setError(null);
      try {
        // поддержка разных контрактов: берём первый успешный
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
        if (!alive) return;
        // некоторые API возвращают {user: {...}}
        const u: UserProfile = (data?.user ?? data) as UserProfile;
        setMe(u);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки профиля.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Profile — EduAI</title>
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <User className="h-6 w-6 text-primary" />
            Profile
          </h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Ваши данные и краткая сводка. Настроить можно в <Link href="/settings" className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">Settings</Link>.
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
                  Войдите, чтобы просматривать профиль.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/login" className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primaryFg">Log in</Link>
                  <Link href="/register" className="rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-white/10 dark:text-gray-200">Create account</Link>
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

        {!loading && !unauthorized && !error && me && (
          <div className="grid gap-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.03, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 text-base font-semibold">Account</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Login" value={me.login} />
                <Field label="User ID" value={String(me.id)} />
                <Field label="Created" value={me.createdAt ? new Date(me.createdAt).toLocaleString() : "—"} />
                <Field label="Updated" value={me.updatedAt ? new Date(me.updatedAt).toLocaleString() : "—"} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.05, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 text-base font-semibold">Learning profile</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Age" value={me.age ?? "—"} />
                <Field label="Education level" value={me.educationLevel ?? "—"} />
                <Field label="Goal" value={me.learningGoal ?? "—"} />
                <Field label="Style" value={me.learningStyle ?? "—"} />
                <Field label="Format" value={me.preferredFormat ?? "—"} />
                <Field label="Tone" value={me.preferredTone ?? "—"} />
                <Field label="Detail level" value={me.detailLevel ?? "—"} />
                <Field label="Prior knowledge" value={me.priorKnowledge ?? "—"} />
                <Field label="Language level" value={me.languageLevel ?? "—"} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: trans(0.07, 0.35) }}
              className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm shadow-soft dark:bg-white/5"
            >
              <div className="mb-2 text-base font-semibold">Display</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Dark mode" value={me.darkMode ? "On" : "Off"} />
                <Field label="Accessible mode" value={me.accessibleMode ? "On" : "Off"} />
                <Field label="Font size" value={me.fontSize ?? "base"} />
              </div>

              <div className="mt-3">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/70 px-3 py-2 text-sm font-medium text-gray-900 transition hover:shadow-ring dark:bg-white/10 dark:text-gray-200"
                >
                  <Settings className="h-4 w-4" />
                  Open Settings
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/70 p-3 dark:bg-white/10">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm">{String(value)}</div>
    </div>
  );
}
