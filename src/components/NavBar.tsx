"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const linksMain = [
  { href: "/", label: "Home" },
  { href: "/subjects", label: "Subjects" },
  { href: "/statistics", label: "Statistics" },
  { href: "/test", label: "Test" },
  { href: "/chat", label: "Chat" },
];

const linksUser = [
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

const linksAuth = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export default function NavBar() {
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const currentTheme = theme === "system" ? systemTheme : theme;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="sticky top-0 z-50">
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 110, damping: 16 } }}
        className="backdrop-blur-md border-b border-white/10 bg-white/60 dark:bg-gray-900/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              EduAI
              <span className="ml-2 inline-block rounded-full bg-indigo-600/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                beta
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden items-center gap-6 md:flex">
              {linksMain.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative text-sm font-medium text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                >
                  {label}
                  {isActive(href) && (
                    <motion.span
                      layoutId="active-underline"
                      className="absolute -bottom-1 left-0 h-0.5 w-full rounded bg-indigo-500"
                    />
                  )}
                </Link>
              ))}

              <span className="h-5 w-px bg-gray-300/50 dark:bg-gray-700/60" />

              {linksUser.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition ${
                    isActive(href)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 hover:text-indigo-500 dark:text-gray-300"
                  }`}
                >
                  {label}
                </Link>
              ))}

              <span className="h-5 w-px bg-gray-300/50 dark:bg-gray-700/60" />

              {linksAuth.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition ${
                    isActive(href)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 hover:text-indigo-500 dark:text-gray-300"
                  }`}
                >
                  {label}
                </Link>
              ))}

              <button
                type="button"
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="ml-2 rounded-md p-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {mounted && currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="rounded-md p-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              type="button"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="backdrop-blur border-t border-white/10 bg-white/70 dark:bg-gray-900/70 md:hidden"
            >
              <div className="flex flex-col gap-2 px-4 py-3">
                {[...linksMain, ...linksUser, ...linksAuth].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-2 py-2 text-sm font-medium transition ${
                      isActive(href)
                        ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setTheme(currentTheme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                  className="mt-1 rounded-md px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {mounted && currentTheme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
