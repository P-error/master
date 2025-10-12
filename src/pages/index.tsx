// src/pages/index.tsx
import Head from "next/head";
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import Section from "@/components/Section";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>EduAI — Adaptive Learning Platform</title>
        <meta
          name="description"
          content="Personalized tests, adaptive content and chat-based tutoring. Raise your score with EduAI."
        />
      </Head>

      <Hero />

      <Section title="What you can do" subtitle="Key flows of the platform">
        <FeatureGrid
          items={[
            {
              title: "Generate Tests",
              desc:
                "Create personalized quizzes by subject and difficulty. The system adapts to your goal score.",
              href: "/test",
              cta: "Start a test",
            },
            {
              title: "Study by Subjects",
              desc:
                "Browse subjects, track progress, and get tailored recommendations.",
              href: "/subjects",
              cta: "Explore subjects",
            },
            {
              title: "Tutor Chat",
              desc:
                "Ask questions and get step-by-step hints. Context-aware, polite, on your level.",
              href: "/chat",
              cta: "Open chat",
            },
            {
              title: "Statistics",
              desc:
                "See trends of attempts, accuracy, and time-to-solve with clean charts.",
              href: "/statistics",
              cta: "View stats",
            },
          ]}
        />
      </Section>

      <Section title="Get started now" subtitle="Log in to save your progress">
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div
            variants={fadeVariants(0)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft transition will-change-transform hover:shadow-ring dark:bg-white/5"
          >
            <h3 className="text-base font-semibold">I already have an account</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Continue where you left off. Your tests and progress will sync.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primaryFg transition hover:opacity-90"
            >
              Log in
            </Link>
          </motion.div>

          <motion.div
            variants={fadeVariants(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft transition will-change-transform hover:shadow-ring dark:bg-white/5"
          >
            <h3 className="text-base font-semibold">I’m new here</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Create an account to unlock adaptive tests and personalized tutoring.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondaryFg transition hover:opacity-90"
            >
              Create account
            </Link>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
