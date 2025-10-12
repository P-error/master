import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";

/**
 * Базовый Layout с “живым” фоном:
 * - мягкие разноцветные градиентные пятна (blurred blobs)
 * - навбар “стекло” и контейнер контента
 * - общий футер
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-white to-gray-50 text-gray-900 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100">
      {/* Animated gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-48 -right-10 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <NavBar />

      <main className="relative z-10 container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} EduAI — Adaptive Learning Platform
      </footer>
    </div>
  );
}
