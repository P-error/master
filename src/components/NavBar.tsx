"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function Navbar() {
  const router = useRouter();
  const { pathname } = router;
  const [open, setOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Избегаем рассинхронизации темы при SSR
  useEffect(() => setMounted(true), []);
  const currentTheme = theme === "system" ? systemTheme : theme;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/subjects", label: "Subjects" },
    { href: "/statistics", label: "Statistics" },
    { href: "/settings", label: "Settings" },
    { href: "/test", label: "Test" },
    { href: "/chat", label: "Chat" },
  ];

  const authLinks = [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
  ];

  const isActive = (href: string) => {
    // Подсветка для точного совпадения и вложенных маршрутов
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition"
          >
            EduAI
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition ${
                  isActive(href)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-indigo-500"
                }`}
              >
                {label}
              </Link>
            ))}

            {authLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition ${
                  isActive(href)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-indigo-500"
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Theme toggle */}
            <button
              onClick={() =>
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {mounted && currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile button */}
          <button
            className="md:hidden text-gray-700 dark:text-gray-300"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex flex-col px-4 py-3 space-y-2">
            {[...navLinks, ...authLinks].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block text-sm font-medium transition ${
                  isActive(href)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-indigo-500"
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Theme toggle for mobile */}
            <button
              onClick={() => {
                setTheme(currentTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-500"
            >
              {mounted && currentTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {mounted && currentTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
