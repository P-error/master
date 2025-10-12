// src/components/Hero.tsx
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeVariants, trans } from "@/lib/motion";

export default function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <motion.div
          variants={fadeVariants(0)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="order-2 md:order-1"
        >
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            Adaptive learning. <span className="text-primary">Smarter</span> tests.
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Generate personalized quizzes, chat with a tutor, and track your progress —
            all in one place. Designed for mobile, built for speed.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/test"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primaryFg transition hover:opacity-90"
            >
              Start a test
            </Link>
            <Link
              href="/subjects"
              className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 shadow-soft transition hover:shadow-ring dark:bg-white/5 dark:text-gray-200"
            >
              Explore subjects
            </Link>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            No API contracts were harmed: routes remain the same.
          </div>
        </motion.div>

        {/* иллюстративный блок с мягкими «плавающими» карточками */}
        <div className="order-1 md:order-2">
          <div className="relative h-56 w-full md:h-64">
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: trans(0.05, 0.45) }}
              className="absolute right-5 top-1/2 w-40 -translate-y-1/2 rounded-2xl bg-white/70 p-3 text-xs shadow-soft dark:bg-white/5"
            >
              <div className="font-semibold">Next attempt</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                Math · difficulty: Medium
              </div>
              <div className="mt-2 inline-flex rounded-lg bg-primary/10 px-2 py-1 text-primary">
                predicted: 78 → goal: 85
              </div>
            </motion.div>

            <motion.div
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: trans(0.1, 0.5) }}
              className="absolute left-0 top-6 w-52 rounded-2xl bg-white/70 p-3 text-xs shadow-soft dark:bg-white/5"
            >
              <div className="font-semibold">Tutor hint</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                Try factoring before substitution.
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: trans(0.15, 0.45) }}
              className="absolute bottom-2 left-10 w-56 rounded-2xl bg-white/70 p-3 text-xs shadow-soft dark:bg-white/5"
            >
              <div className="font-semibold">Progress</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                7/10 correct · 3m avg time
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
