import { memo } from "react";
import { BookOpen, ChevronRight, Play } from "lucide-react";

export type Subject = {
  id: string;
  name: string;
  description: string;
  progress: number;   // 0..100
  attempts: number;
  lastActivity?: string | null;
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function SubjectCardBase({
  subject,
  onStart,
  onOpenDetails,
}: {
  subject: Subject;
  onStart: () => void;
  onOpenDetails?: () => void;
}) {
  const { name, description, progress, attempts, lastActivity } = subject;

  return (
    <article className="h-full rounded-2xl border border-white/10 bg-white/70 p-4 shadow-soft transition will-change-transform dark:bg-white/5">
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-white/10">
          <BookOpen className="h-4 w-4" />
        </div>
        <h3 className="line-clamp-1 text-base font-semibold">{name}</h3>
      </div>

      <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
        {description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Progress
        </span>
        <span className="text-xs font-medium">{progress}%</span>
      </div>
      <ProgressBar value={progress} />

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div>Attempts: <span className="font-medium text-gray-800 dark:text-gray-200">{attempts}</span></div>
        <div className="text-right">
          {lastActivity ? new Date(lastActivity).toLocaleDateString() : "—"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onStart}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primaryFg transition hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Start test
        </button>

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm font-medium text-gray-900 hover:shadow-ring dark:bg-white/10 dark:text-gray-200"
            aria-label="Open details"
            title="Open details"
          >
            Details
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

const SubjectCard = memo(SubjectCardBase);
export default SubjectCard;
