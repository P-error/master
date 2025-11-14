// src/components/TestForm.tsx
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/lib/motion";
import SubjectAutocomplete from "@/components/SubjectAutocomplete";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type Mode = "ACADEMIC" | "COMFORT" | "RANDOM";

export type GenPayload = {
  subjectId?: number;
  topic?: string;
  difficulty: Difficulty;
  count: number;
  goal: number;
  mode: Mode;
};

type Props = {
  disabled?: boolean;
  defaultValues?: Partial<GenPayload>;
  onSubmit: (payload: GenPayload) => void | Promise<void>;
};

export default function TestForm({ disabled, defaultValues, onSubmit }: Props) {
  // дефолты (на случай, если что-то придёт из query или сохранённых пресетов)
  const dv: Partial<GenPayload> = {
    subjectId: defaultValues?.subjectId,
    topic: defaultValues?.topic ?? "",
    difficulty: (defaultValues?.difficulty ?? "MEDIUM") as Difficulty,
    count: defaultValues?.count ?? 10,
    goal: defaultValues?.goal ?? 80,
    mode: (defaultValues?.mode ?? "ACADEMIC") as Mode,
  };

  const [subjectId, setSubjectId] = useState<number | undefined>(dv.subjectId);
  const [subjectQuery, setSubjectQuery] = useState<string>(dv.topic ?? "");
  const [topic, setTopic] = useState<string>(dv.topic ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(dv.difficulty ?? "MEDIUM");
  const [count, setCount] = useState<number>(dv.count ?? 10);
  const [goal, setGoal] = useState<number>(dv.goal ?? 80);
  const [mode, setMode] = useState<Mode>(dv.mode ?? "ACADEMIC");

  const numericCount = Number.isFinite(count) ? count : 0;
  const numericGoal = Number.isFinite(goal) ? goal : 0;

  const topicOrSubjectFilled =
    (subjectId !== undefined && subjectId !== null) || topic.trim().length > 0 || subjectQuery.trim().length > 0;

  const countValid = numericCount > 0 && numericCount <= 50;
  const goalValid = numericGoal >= 0 && numericGoal <= 100;

  const canSubmit = !disabled && topicOrSubjectFilled && countValid && goalValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: GenPayload = {
      subjectId,
      topic: topic.trim() || (subjectQuery.trim() || undefined),
      difficulty,
      count: numericCount,
      goal: Math.round(numericGoal),
      mode,
    };

    await onSubmit(payload);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={fadeVariants(0.1)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Предмет */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Предмет (необязательно)
          </label>
          <div className="mt-1">
            <SubjectAutocomplete
              value={subjectQuery}
              onChange={(next) => {
                setSubjectQuery(next);
                // если пользователь руками меняет строку — сбрасываем выбранный subjectId
                if (subjectId !== undefined) setSubjectId(undefined);
              }}
              onSelect={(choice) => {
                if (choice.id) {
                  setSubjectId(choice.id);
                  setSubjectQuery(choice.name);
                  // если темы ещё нет, подставим название предмета
                  if (!topic.trim()) setTopic(choice.name);
                } else {
                  setSubjectId(undefined);
                  setSubjectQuery(choice.name ?? "");
                }
              }}
              placeholder="Выберите предмет или начните вводить название…"
              disabled={disabled}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Можно выбрать предмет или оставить пустым и задать тему вручную ниже.
          </p>
        </div>

        {/* Тема */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Тема</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: Алгоритмы сортировки, Линейные уравнения…"
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Можно оставить пустым, если достаточно выбранного предмета.
          </p>
        </div>

        {/* Сложность */}
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Сложность</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          >
            <option value="EASY">Лёгкая</option>
            <option value="MEDIUM">Средняя</option>
            <option value=" HARD">Сложная</option>
          </select>
        </div>

        {/* Режим */}
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Режим</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          >
            <option value="ACADEMIC">Академический</option>
            <option value="COMFORT">Комфортный</option>
            <option value="RANDOM">Случайный</option>
          </select>
        </div>

        {/* Кол-во вопросов */}
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Количество вопросов</label>
          <input
            type="number"
            min={1}
            max={50}
            value={Number.isNaN(numericCount) ? "" : numericCount}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCount(Number.isNaN(v) ? 0 : v);
            }}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">От 1 до 50 вопросов.</p>
        </div>

        {/* Целевой балл */}
        <div className="col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Целевой балл (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={Number.isNaN(numericGoal) ? "" : numericGoal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setGoal(Number.isNaN(v) ? 0 : v);
            }}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Если процент правильных ответов будет не ниже этого порога, тест считается пройденным.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          title={
            !canSubmit
              ? "Заполните тему или предмет, а также корректные параметры"
              : "Сгенерировать тест"
          }
        >
          Сгенерировать
        </button>
      </div>
    </motion.form>
  );
}
