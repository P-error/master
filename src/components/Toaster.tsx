import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { useToast } from "@/lib/toast";

export default function Toaster() {
  const { toasts, remove } = useToast();

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-end gap-2 p-4 sm:p-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon =
            t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
          const border =
            t.type === "success"
              ? "border-emerald-500/40"
              : t.type === "error"
              ? "border-red-500/40"
              : "border-indigo-500/40";
          const bg =
            t.type === "success"
              ? "bg-emerald-500/10"
              : t.type === "error"
              ? "bg-red-500/10"
              : "bg-indigo-500/10";

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border ${border} ${bg} backdrop-blur`}
            >
              <div className="flex items-start gap-3 p-3 text-sm">
                <div className="mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {t.title && <div className="font-medium">{t.title}</div>}
                  <div className="text-gray-800 dark:text-gray-200">{t.message}</div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded-md p-1 text-gray-700 transition hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10"
                  aria-label="Закрыть уведомление"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
