import type { ReactNode } from "react";
import Navbar from "@/components/NavBar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} EduAI — Adaptive Learning Platform
      </footer>
    </div>
  );
}
