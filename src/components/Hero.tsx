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
            Адаптивное обучение. <span className="text-primary">Умные тесты.</span> 
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Генерируйте персонализированные викторины, общайтесь с EduAI и отслеживайте свой прогресс —
            всё в одном месте. Разработано для мобильных устройств, оптимизировано для скорости.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/test"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primaryFg transition hover:opacity-90"
            >
              Начать тест
            </Link>
            <Link
              href="/subjects"
              className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 shadow-soft transition hover:shadow-ring dark:bg-white/5 dark:text-gray-200"
            >
              Изучить предметы
            </Link>
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
              <div className="font-semibold">Следующая попытка</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                Математика · сложность: Средняя
              </div>
              <div className="mt-2 inline-flex rounded-lg bg-primary/10 px-2 py-1 text-primary">
                прогноз: 78 → цель: 85
              </div>
            </motion.div>

            <motion.div
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: trans(0.1, 0.5) }}
              className="absolute left-0 top-6 w-52 rounded-2xl bg-white/70 p-3 text-xs shadow-soft dark:bg-white/5"
            >
              <div className="font-semibold">Подсказка EduAI</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                Попробуйте разложить на множители перед подстановкой.
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: trans(0.15, 0.45) }}
              className="absolute bottom-2 left-10 w-56 rounded-2xl bg-white/70 p-3 text-xs shadow-soft dark:bg-white/5"
            >
              <div className="font-semibold">Прогресс</div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                7/10 верно · 3 мин среднее время
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
