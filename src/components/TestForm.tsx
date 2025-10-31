// src/components/TestForm.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";
import SubjectAutocomplete from "@/components/SubjectAutocomplete";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type GenPayload = {
  subjectId?: number;
  topic?: string;
  difficulty: Difficulty;
  count: number;
  goal: number;
};

type Props = {
  disabled?: boolean;
  defaultValues?: Partial<GenPayload>;
  onSubmit: (payload: GenPayload) => void | Promise<void>;
};

export default function TestForm({ disabled, defaultValues, onSubmit }: Props) {
  type FormDefaults = Partial<GenPayload>;

  const dv: FormDefaults = {
  subjectId: defaultValues?.subjectId,
  topic: defaultValues?.topic ?? "",
  difficulty: defaultValues?.difficulty ?? "MEDIUM",
  count: defaultValues?.count ?? 10,
  mode: defaultValues?.mode ?? "RANDOM",
  savable: defaultValues?.savable ?? true,
};

  const [topic, setTopic] = useState<string>(dv.topic);
  const [subjectId, setSubjectId] = useState<number | undefined>(dv.subjectId);
  const [subjectQuery, setSubjectQuery] = useState<string>(""); // всегда строка для SubjectAutocomplete
  const [difficulty, setDifficulty] = useState<Difficulty>(dv.difficulty);
  const [count, setCount] = useState<number>(dv.count);
  const [goal, setGoal] = useState<number>(dv.goal);

  useEffect(() => {
    const next: Required<GenPayload> = {
      subjectId: defaultValues?.subjectId ?? undefined,
      topic: defaultValues?.topic ?? "",
      difficulty: (defaultValues?.difficulty ?? "MEDIUM") as Difficulty,
      count: defaultValues?.count ?? 10,
      goal: defaultValues?.goal ?? 80,
    };
    setTopic(next.topic);
    setSubjectId(next.subjectId);
    setSubjectQuery("");
    setDifficulty(next.difficulty);
    setCount(next.count);
    setGoal(next.goal);
  }, [
    defaultValues?.subjectId,
    defaultValues?.topic,
    defaultValues?.difficulty,
    defaultValues?.count,
    defaultValues?.goal,
  ]);

  const canSubmit = (() => {
    if (disabled) return false;
    if (!subjectId && !topic.trim()) return false;
    if (count < 1 || count > 20) return false;
    if (goal < 1 || goal > 100) return false;
    return true;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload: GenPayload = {
      subjectId: subjectId || undefined,
      topic: topic.trim() || undefined,
      difficulty,
      count,
      goal,
    };
    await onSubmit(payload);
  };

  return (
    <motion.form
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Предмет</label>
          <div className="mt-1">
            <SubjectAutocomplete
              disabled={!!disabled}
              value={subjectQuery}
              onChange={(val: string) => {
                const v = typeof val === "string" ? val : "";
                setSubjectQuery(v);
                if (!v) setSubjectId(undefined);
              }}
              onSelect={(choice: { id: number | null; name: string }) => {
                if (choice && choice.id != null) {
                  setSubjectId(Number(choice.id));
                  setSubjectQuery(choice.name ?? String(choice.id));
                } else {
                  setSubjectId(undefined);
                  setSubjectQuery("");
                }
              }}
              placeholder="Выберите предмет (необязательно)"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Можно выбрать предмет или оставить пустым и ввести тему ниже.
          </p>
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Тема</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!!disabled}
            placeholder="Например: Дифференциальные уравнения"
            className="mt-1 w-full rounded-xl border border-gray-300/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Если выбран предмет — тему можно оставить пустой.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Сложность</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={!!disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Кол-во вопросов</label>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={!!disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
          />
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Целевой балл</label>
          <input
            type="number"
            min={1}
            max={100}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            disabled={!!disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          title={!canSubmit ? "Заполните тему или предмет, а также корректные параметры" : "Сгенерировать тест"}
        >
          Сгенерировать
        </button>
      </div>
    </motion.form>
  );
}
