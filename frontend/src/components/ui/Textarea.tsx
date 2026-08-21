import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink-700)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          className={cn(
            "w-full resize-none rounded-[var(--radius-control)] border bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink-900)]",
            "placeholder:text-[var(--color-ink-400)] transition-colors",
            "border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/30 focus-visible:border-[var(--color-brand-500)]",
            error && "border-[var(--color-danger-500)] focus-visible:ring-[var(--color-danger-500)]/20",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-[var(--color-danger-500)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--color-ink-400)]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
