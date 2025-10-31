// src/components/SubjectAutocomplete.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

type ApiSubject = {
  id: number;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
};

export type SubjectChoice = {
  id: number | null;         // null — если пользователь остался на «свободной теме»
  name: string;              // то, что в инпуте
  difficulty?: "EASY" | "MEDIUM" | "HARD";
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  onSelect: (choice: SubjectChoice) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // если хотим автозадавать subjectId при явном выборе — оставляем по умолчанию true
  autoFillOnPick?: boolean;
};

// Русские ярлыки сложности
const RU_DIFF: Record<string, string> = {
  EASY: "лёгкая",
  MEDIUM: "средняя",
  HARD: "сложная",
};

const DIFF_ORDER = ["EASY", "MEDIUM", "HARD"];

export default function SubjectAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Введите тему или выберите предмет…",
  disabled,
  className = "",
  autoFillOnPick = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiSubject[]>([]);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Поиск — только по названию (бэкенд и так фильтрует name contains q)
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = value.trim();

    // если пусто — можно не дёргать сеть
    if (!q) {
      setItems([]);
      setError(null);
      setBusy(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/subjects?q=${encodeURIComponent(q)}`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store", // важно: чтобы не словить 304/stale
        });

        if (res.status === 401) {
          setItems([]);
          setError("Требуется вход.");
        } else if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as any)?.error || `HTTP ${res.status}`);
        } else {
          const data = await res.json().catch(() => ({} as any));

          // Поддержка нового API: { ok: true, items: ApiSubject[] }
          // и обратная совместимость со старым: { subjects: ApiSubject[] } или массив
          const list: ApiSubject[] = Array.isArray(data)
            ? (data as ApiSubject[])
            : (data?.items as ApiSubject[]) ||
              (data?.subjects as ApiSubject[]) ||
              [];

          // упорядочим подсказки: сначала точнее по строке, затем по сложности
          const qq = q.toLowerCase();
          const sorted = [...list].sort((a, b) => {
            const as = Number(a.name.toLowerCase().startsWith(qq));
            const bs = Number(b.name.toLowerCase().startsWith(qq));
            if (as !== bs) return bs - as;
            const ai = DIFF_ORDER.indexOf(a.difficulty as any);
            const bi = DIFF_ORDER.indexOf(b.difficulty as any);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          });

          setItems(sorted);
        }
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки предметов.");
        setItems([]);
      } finally {
        setBusy(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, open]);

  // Закрытие по клику вне
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (boxRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hasList = open && (busy || error || items.length > 0 || value.trim().length > 0);

  function pick(s?: ApiSubject) {
    if (s && autoFillOnPick) {
      onChange(s.name);
      onSelect({ id: s.id, name: s.name, difficulty: s.difficulty as any });
    } else {
      // свободная тема — без subjectId
      onSelect({ id: null, name: value.trim() });
    }
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, items.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[highlight]) pick(items[highlight]);
      else pick(); // свободная тема
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const menu = useMemo(() => {
    if (!hasList) return null;
    return (
      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-white/90 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/95">
        {busy && (
          <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">Загрузка…</div>
        )}
        {error && (
          <div className="px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}
        {!busy && !error && items.length === 0 && value.trim() && (
          <button
            type="button"
            onClick={() => pick()}
            className="block w-full px-3 py-2 text-left text-sm hover:bg黑/5 dark:hover:bg-white/10"
          >
            Свободная тема: «{value.trim()}»
          </button>
        )}
        {!busy &&
          !error &&
          items.map((s, i) => {
            const diffRu = RU_DIFF[s.difficulty] ?? s.difficulty?.toLowerCase() ?? "";
            const active = i === highlight;
            return (
              <button
                key={`${s.id}-${i}`}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
                className={
                  "block w-full px-3 py-2 text-left text-sm " +
                  (active ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10")
                }
                title={`${s.name} — ${diffRu}`}
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Сложность: {diffRu}</div>
              </button>
            );
          })}
      </div>
    );
  }, [hasList, busy, error, items, highlight, value]);

  return (
    <div ref={boxRef} className={"relative " + className}>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-white/20 bg-white/70 px-9 py-2 text-sm text-gray-900 shadow-inner transition focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      {menu}
    </div>
  );
}
