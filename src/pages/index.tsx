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
        <title>EduAI — Платформа адаптивного обучения</title>
        <meta
          name="description"
          content="Персонализированные тесты и адаптивный контент. Повышайте свои результаты с EduAI."
        />
      </Head>

      <Hero />

      <Section title="Что вы можете сделать" subtitle="Ключевые сценарии платформы">
        <FeatureGrid
          items={[
            {
              title: "Генерация тестов",
              desc:
                "Создавайте персонализированные викторины по предмету и сложности. Система подстраивается под ваш целевой балл.",
              href: "/test",
              cta: "Начать тест",
            },
            {
              title: "Обучение по предметам",
              desc:
                "Просматривайте предметы, отслеживайте прогресс и получайте персональные рекомендации.",
              href: "/subjects",
              cta: "Изучить предметы",
            },
            {
              title: "Чат с EduAI",
              desc:
                "Задавайте вопросы и получайте пошаговые подсказки. Контекстно, вежливо и на вашем уровне.",
              href: "/chat",
              cta: "Открыть чат",
            },
            {
              title: "Статистика",
              desc:
                "Смотрите тренды по попыткам, точности и времени решения на наглядных графиках.",
              href: "/statistics",
              cta: "Посмотреть статистику",
            },
          ]}
        />
      </Section>

      <Section title="Начните сейчас" subtitle="Войдите, чтобы сохранить прогресс">
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div
            variants={fadeVariants(0)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft transition will-change-transform hover:shadow-ring dark:bg-white/5"
          >
            <h3 className="text-base font-semibold">У меня уже есть аккаунт</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Продолжайте с того места, где остановились. Ваши тесты и прогресс синхронизируются.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primaryFg transition hover:opacity-90"
            >
              Войти
            </Link>
          </motion.div>

          <motion.div
            variants={fadeVariants(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft transition will-change-transform hover:shadow-ring dark:bg-white/5"
          >
            <h3 className="text-base font-semibold">Я здесь впервые</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Создайте аккаунт, чтобы открыть адаптивные тесты и персонализированное обучение.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondaryFg transition hover:opacity-90"
            >
              Создать аккаунт
            </Link>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
