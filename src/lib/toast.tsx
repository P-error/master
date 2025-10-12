import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

export type ToastType = "success" | "error" | "info";
export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  timeout?: number; // ms
};

type Ctx = {
  notify: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
  toasts: Toast[];
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const item: Toast = { id, timeout: 3500, ...t };
    setToasts((prev) => [...prev, item]);
    if (item.timeout && item.timeout > 0) {
      setTimeout(() => remove(id), item.timeout);
    }
  }, [remove]);

  const value = useMemo(() => ({ notify, remove, toasts }), [notify, remove, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
