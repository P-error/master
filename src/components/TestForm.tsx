import { useState } from "react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";

export type GenPayload = {
  subjectId?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  count: number;
  goal: number; // целевой балл
};

export default function TestForm({
  defaultValues,
  disabled,
  onSubmit,
}: {
  defaultValues: GenPayload;
  disabled?: boolean;
  onSubmit: (payload: GenPayload) => void;
}) {
  const [subjectId, setSubjectId] = useState(defaultValues.subjectId ?? "");
  const [difficulty, setDifficulty] = useState<GenPayload["difficulty"]>(defaultValues.difficulty);
  const [count, setCount] = useState(defaultValues.count);
  const [goal, setGoal] = useState(defaultValues.goal);

  return (
    <motion.div variants={fadeVariants(0)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Subject ID (optional)</label>
        <input
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={disabled}
          placeholder="e.g., math-101"
          className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as GenPayload["difficulty"])}
          disabled={disabled}
          className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Questions count</label>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          disabled={disabled}
          className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Goal score</label>
        <input
          type="number"
          min={1}
          max={100}
          value={goal}
          onChange={(e) => setGoal(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          disabled={disabled}
          className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSubmit({
              subjectId: subjectId.trim() || undefined,
              difficulty,
              count,
              goal,
            })
          }
          className="w-full rounded-xl border border-white/20 bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 transition hover:shadow-ring disabled:opacity-60 dark:bg-white/10 dark:text-gray-200"
        >
          Подготовить
        </button>
      </div>
    </motion.div>
  );
}
