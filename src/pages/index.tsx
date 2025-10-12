import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  BarChart3,
  TestTube,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";

type Me = { id: number; name: string; email: string } | null;

export default function HomePage() {
  const [me, setMe] = useState<Me>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) throw new Error("not auth");
        const data = await res.json().catch(() => ({}));
        setMe({
          id: Number(data.id ?? data.userId ?? 0),
          name: String(data.name ?? data.username ?? "User"),
          email: String(data.email ?? "unknown@example.com"),
        });
      } catch {
        setMe(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-8 shadow-sm backdrop-blur dark:bg-gray-900/50 md:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <motion.h1
          {...fadeUp(0.03)}
          className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
        >
          Учись быстрее с{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
            EduAI
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.08)}
          className="mt-3 max-w-2xl text-base text-gray-700 dark:text-gray-300"
        >
          Персонализированные тесты, анализ навыков по темам, рекомендации и чат с ИИ — всё в
          одном месте. Начните с генерации теста или задайте вопрос в чате.
        </motion.p>

        <motion.div {...fadeUp(0.14)} className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/test"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-110"
          >
            <TestTube className="mr-2 h-4 w-4" />
            Сгенерировать тест
          </Link>

          <Link
            href="/chat"
            className="inline-flex items-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Открыть чат
          </Link>

          <Link
            href="/subjects"
            className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-white/60 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Предметы
          </Link>
        </motion.div>

        {/* Auth-aware CTA */}
        <motion.div {...fadeUp(0.18)} className="mt-6">
          {authChecked && me ? (
            <div className="inline-flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/70 px-3 py-1.5 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-300">
                <User className="mr-2 h-4 w-4 text-indigo-500" />
                Привет, {me.name}
              </span>
              <Link
                href="/statistics"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/60 px-4 py-2 text-sm text-gray-800 transition hover:bg-white/80 dark:text-gray-200"
              >
                Перейти к статистике
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/60 px-4 py-2 text-sm text-gray-800 transition hover:bg-white/80 dark:text-gray-200"
              >
                Профиль
              </Link>
            </div>
          ) : (
            <div className="inline-flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/60 px-4 py-2 text-sm text-gray-800 transition hover:bg-white/80 dark:text-gray-200"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:brightness-110"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Регистрация
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* Фичи карточками */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            title: "Генератор тестов",
            desc: "Выбери тему, сложность и теги — получи тест с авто-проверкой.",
            icon: TestTube,
            href: "/test",
          },
          {
            title: "Аналитика и статистика",
            desc: "Смотри точность по темам, историю попыток и прогресс.",
            icon: BarChart3,
            href: "/statistics",
          },
          {
            title: "Каталог предметов",
            desc: "Выбирай дисциплины и темы, формируй подборки заданий.",
            icon: BookOpen,
            href: "/subjects",
          },
          {
            title: "Чат с ИИ",
            desc: "Задавай вопросы и получай объяснения с примерами.",
            icon: MessageSquare,
            href: "/chat",
          },
        ].map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ y: 12, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.05 * (i + 1), duration: 0.45 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-5 backdrop-blur transition hover:shadow-md dark:bg-gray-900/50"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-2xl transition group-hover:opacity-100">
              <div className="absolute -inset-x-6 top-0 h-24 bg-gradient-to-r from-indigo-400/20 via-fuchsia-400/20 to-cyan-400/20" />
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-300">
                <c.icon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{c.desc}</p>
              </div>
            </div>
            <Link
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              href={c.href}
            >
              Перейти →
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Краткое руководство (README-lite) */}
      <section className="prose prose-slate dark:prose-invert max-w-none">
        <motion.h2 {...fadeUp(0.02)}>Как пользоваться</motion.h2>
        <motion.ol {...fadeUp(0.04)}>
          <li>
            <b>Авторизация:</b> войдите или зарегистрируйтесь через вкладки <code>Login</code> /
            <code> Register</code>.
          </li>
          <li>
            <b>Генерация теста:</b> на странице <code>Test</code> укажите <i>Subject ID</i>, тему,
            сложность и теги — затем нажмите <code>Generate</code>.
          </li>
          <li>
            <b>Прохождение и отправка:</b> ответьте на вопросы и нажмите <code>Submit</code>.
            Появится разбор с точностью по тегам.
          </li>
          <li>
            <b>Сохранение результатов:</b> после входа нажмите <code>Save attempt</code> — это
            отобразится в <code>Statistics</code>.
          </li>
          <li>
            <b>Объяснения от ИИ:</b> используйте <code>Chat</code>, чтобы получить разбор решений и
            примеры.
          </li>
        </motion.ol>

        <motion.h2 {...fadeUp(0.06)}>Технические особенности</motion.h2>
        <motion.ul {...fadeUp(0.08)}>
          <li>Next.js (Pages Router)</li>
          <li>Tailwind CSS (адаптивный дизайн)</li>
          <li>OpenAI API для генерации вопросов и ответов в чате</li>
          <li>Prisma + PostgreSQL (Neon) для хранения данных</li>
          <li>JWT-авторизация, деплой на Vercel</li>
        </motion.ul>

        <motion.p {...fadeUp(0.1)} className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} EduAI — адаптивная система обучения.
        </motion.p>
      </section>
    </div>
  );
}
