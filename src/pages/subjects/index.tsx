import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { fadeVariants, scaleTap, trans } from "@/lib/motion";
import SubjectCard, { Subject } from "@/components/SubjectCard";
import Link from "next/link";
import { AlertTriangle, Loader2, Search } from "lucide-react";

type ApiSubject = Record<string, any>;

export default function SubjectsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [items, setItems] = useState<ApiSubject[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);
      try {
        const res = await fetch("/api/subjects", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          if (!alive) return;
          setUnauthorized(true);
          setItems([]);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any));
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as ApiSubject[] | { subjects: ApiSubject[] };
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any).subjects)
          ? (data as any).subjects
          : [];
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load subjects.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const normalized: Subject[] = useMemo(() => {
    return items.map((s: ApiSubject) => {
      const id = String(
        s.id ?? s.subjectId ?? s.slug ?? s.code ?? Math.random().toString(36).slice(2)
      );
      const name = s.name ?? s.title ?? s.subjectName ?? "Unnamed subject";
      const description = s.description ?? s.summary ?? s.about ?? "No description provided.";
      const progress = clamp0to100(s.progress ?? s.completion ?? s.stats?.progress ?? 0);
      const attempts = s.attempts ?? s.stats?.attempts ?? 0;
      const lastActivity = s.updatedAt ?? s.lastActivity ?? s.stats?.lastActivity ?? null;
      return { id, name, description, progress, attempts, lastActivity };
    });
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return normalized;
    return normalized.filter(
      (s) =>
        s.name.toLowerCase().includes(qq) || s.description.toLowerCase().includes(qq)
    );
  }, [normalized, q]);

  return (
    <>
      <Head>
        <title>Subjects — EduAI</title>
      </Head>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Subjects</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Choose a subject to start an adaptive test or continue where you left off.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: trans(0.03, 0.3) }}
          className="relative mb-4"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subjects…"
            className="w-full rounded-xl border border-white/20 bg-white/70 px-9 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-3 text-sm dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subjects…
          </div>
        )}

        {!loading && unauthorized && (
          <div className="rounded-2xl border border-white/10 bg-white/60 p-5 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-semibold">Sign in required</div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Please log in to view your subjects.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/login" className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primaryFg">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-white/10 dark:text-gray-200"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !unauthorized && error && (
          <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">
            Failed to load subjects: {error}
          </div>
        )}

        {!loading && !unauthorized && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/60 p-5 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
            No subjects found. Try a different keyword.
          </div>
        )}

        {!loading && !unauthorized && !error && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                variants={fadeVariants(0.02 * i)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <motion.div variants={scaleTap} initial="initial" whileHover="hover" whileTap="tap">
                  <SubjectCard
                    subject={s}
                    onStart={() => router.push(`/test?subject=${encodeURIComponent(s.id)}`)}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function clamp0to100(v: any): number {
  const n = Number.isFinite(v) ? Number(v) : 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}
