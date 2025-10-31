import { motion } from "framer-motion";
import { fadeVariants, scaleTap } from "@/lib/motion";

export type Question = {
  id: string;
  text: string;
  type: "single" | "text";
  options?: string[]; // для single
};

export type UserAnswer = {
  qid: string;
  answer: number | string | null; // индекс для single, текст для text
};

export default function QuestionCard({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: Question;
  value: number | string | null;
  onChange: (val: number | string | null) => void;
}) {
  return (
    <motion.article
      variants={fadeVariants(index * 0.03)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/60 p-4 shadow-soft dark:bg-white/5"
    >
      <div className="mb-2 text-sm font-semibold">
        Вопрос {index + 1}. {question.text}
      </div>

      {question.type === "single" && Array.isArray(question.options) ? (
        <div className="grid gap-2">
          {question.options.map((opt, i) => {
            const active = value === i;
            return (
              <motion.button
                key={i}
                type="button"
                variants={scaleTap}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => onChange(i)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "bg-white/70 text-gray-900 dark:bg-white/10 dark:text-gray-200"
                }`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Введите ответ…"
          rows={3}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
        />
      )}
    </motion.article>
  );
}
