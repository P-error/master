// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";

const linksMain = [
  { href: "/", label: "Главная", match: "equal" as const },
  { href: "/subjects", label: "Предметы", match: "startsWith" as const },
  { href: "/statistics", label: "Статистика", match: "startsWith" as const },
  { href: "/test", label: "Тест", match: "startsWith" as const },
  { href: "/chat", label: "Чат", match: "startsWith" as const },
];

const linksAuth = [
  { href: "/login", label: "Вход", match: "equal" as const },
  { href: "/register", label: "Регистрация", match: "equal" as const },
  { href: "/profile", label: "Профиль", match: "startsWith" as const },
  { href: "/settings", label: "Настройки", match: "startsWith" as const },
];

export default function NavBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    // close on route change to avoid stuck open sheet
    const done = () => setOpen(false);
    router.events.on("routeChangeComplete", done);
    return () => router.events.off("routeChangeComplete", done);
  }, [router.events]);

  const currentTheme = theme === "system" ? systemTheme : theme;

  // Активатор ссылки: точное совпадение ("/") или startsWith ("/test" подходит под "/test/abc")
  const isActive = useMemo(() => {
    const path = router.asPath || router.pathname || "/";
    return (href: string, match: "equal" | "startsWith") => {
      if (match === "equal") return path === href;
      // нормализуем слэш в конце
      const norm = (s: string) => (s.endsWith("/") && s !== "/" ? s.slice(0, -1) : s);
      return norm(path).startsWith(norm(href));
    };
  }, [router.asPath, router.pathname]);

  return (
    <div className="sticky top-0 z-50">
      <motion.nav
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: trans(0, 0.35) }}
        className="mx-2 mt-2 rounded-2xl border border-white/10 bg-white/60 shadow-glass backdrop-blur-xs
                   dark:bg-white/5 sm:mx-4 sm:mt-4"
        aria-label="Основная навигация"
      >
        <div className="flex items-center justify-between px-4 py-2 sm:px-5">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-xl p-1">
            <span className="inline-block h-6 w-6 rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-soft group-hover:scale-105 transition" />
            <span className="text-sm font-semibold tracking-tight">EduAI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {linksMain.map((l) => {
              const active = isActive(l.href, l.match);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm transition will-change-transform
                  ${active ? "bg-primary/10 text-primary" : "text-gray-600 hover:text-primary dark:text-gray-300"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {linksAuth.map((l) => {
              const active = isActive(l.href, l.match);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm transition
                  ${active ? "bg-secondary/10 text-secondary" : "text-gray-600 hover:text-secondary dark:text-gray-300"}`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/60 text-gray-700 transition hover:shadow-soft dark:bg-white/5 dark:text-gray-200"
              aria-label="Переключить тему"
              title="Переключить тему"
            >
              {mounted && currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile toggles */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/60 text-gray-700 transition hover:shadow-soft dark:bg-white/5 dark:text-gray-200"
              aria-label="Переключить тему"
              title="Переключить тему"
            >
              {mounted && currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/60 text-gray-700 transition hover:shadow-soft dark:bg-white/5 dark:text-gray-200"
              aria-expanded={open}
              aria-label="Открыть меню"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="mobile"
              variants={fadeVariants(0)}
              initial="hidden"
              animate="show"
              exit={{ height: 0, opacity: 0, transition: trans(0, 0.2) }}
              className="border-t border-white/10 px-3 pb-3 md:hidden"
            >
              <div className="mt-2 grid grid-cols-2 gap-2">
                {linksMain.map((l) => {
                  const active = isActive(l.href, l.match);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm transition
                        ${active
                          ? "bg-primary/15 text-primary"
                          : "bg-white/70 text-gray-800 hover:bg-white dark:bg-white/5 dark:text-gray-200"}`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                {linksAuth.map((l) => {
                  const active = isActive(l.href, l.match);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm transition
                        ${active
                          ? "bg-secondary/15 text-secondary"
                          : "bg-white/70 text-gray-800 hover:bg-white dark:bg-white/5 dark:text-gray-200"}`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setTheme(currentTheme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                  className="mt-1 rounded-md px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {mounted && currentTheme === "dark" ? "Светлая тема" : "Тёмная тема"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
