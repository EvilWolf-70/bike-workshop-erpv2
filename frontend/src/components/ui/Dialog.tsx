import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Set on dialogs opened from within another dialog (e.g. quick-add) so they stack visually above it. */
  layer?: "base" | "top";
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * Tracks which open Dialog is topmost so that a single Escape press only
 * closes the dialog the user is actually looking at — without this,
 * opening a quick-add dialog from inside another dialog means Escape
 * would fire both dialogs' listeners and close everything at once,
 * silently discarding whatever the outer form had in progress.
 */
let dialogStack: symbol[] = [];

export function Dialog({ open, onClose, title, description, children, footer, size = "md", layer = "base" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(Symbol("dialog"));

  useEffect(() => {
    if (!open) return;
    const id = idRef.current;
    dialogStack.push(id);
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dialogStack[dialogStack.length - 1] === id) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      dialogStack = dialogStack.filter((x) => x !== id);
      document.removeEventListener("keydown", onKeyDown);
      if (dialogStack.length === 0) document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    // Mobile: anchored to the bottom edge, full width, no outer padding — a bottom sheet.
    // sm and up: centered modal with breathing room around it, as before.
    <div className={cn("fixed inset-0 flex items-end justify-center sm:items-center sm:p-4", layer === "top" ? "z-[60]" : "z-50")}>
      <div
        className="absolute inset-0 bg-[var(--color-ink-900)]/40 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative w-full rounded-t-2xl bg-white shadow-2xl sm:rounded-[var(--radius-card)]",
          "flex max-h-[92vh] flex-col sm:max-h-[calc(100vh-2rem)]",
          "animate-[dialogIn_180ms_cubic-bezier(0.16,1,0.3,1)]",
          sizeClasses[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id="dialog-title" className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-[var(--color-ink-500)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-full p-1.5 text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-700)] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse items-stretch gap-2 border-t border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dialogIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>,
    document.body
  );
}
