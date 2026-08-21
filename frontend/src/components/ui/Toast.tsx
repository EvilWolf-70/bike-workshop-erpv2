import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                "flex items-start gap-2.5 rounded-[var(--radius-control)] border bg-white px-4 py-3 shadow-lg",
                "animate-[toastIn_200ms_cubic-bezier(0.16,1,0.3,1)]",
                t.kind === "success" ? "border-[var(--color-success-500)]/20" : "border-[var(--color-danger-500)]/20"
              )}
            >
              {t.kind === "success" ? (
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-success-500)]" />
              ) : (
                <XCircle className="size-5 shrink-0 text-[var(--color-danger-500)]" />
              )}
              <p className="flex-1 text-sm text-[var(--color-ink-700)] pt-0.5">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </ToastContext.Provider>
  );
}
