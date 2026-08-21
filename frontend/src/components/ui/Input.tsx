import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  /** Rendered inside the field, right-aligned — e.g. a show/hide password toggle. */
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, mono, endAdornment, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink-700)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "h-11 w-full rounded-[var(--radius-control)] border bg-white px-3.5 text-sm text-[var(--color-ink-900)]",
              "placeholder:text-[var(--color-ink-400)] transition-colors",
              "border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/30 focus-visible:border-[var(--color-brand-500)]",
              error && "border-[var(--color-danger-500)] focus-visible:ring-[var(--color-danger-500)]/20",
              mono && "font-mono",
              endAdornment && "pr-10",
              className
            )}
            {...props}
          />
          {endAdornment && <div className="absolute right-1 top-1/2 -translate-y-1/2">{endAdornment}</div>}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-[var(--color-danger-500)]">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--color-ink-400)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
