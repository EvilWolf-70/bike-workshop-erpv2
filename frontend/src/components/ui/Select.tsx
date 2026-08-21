import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-ink-700)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "h-11 w-full appearance-none rounded-[var(--radius-control)] border bg-white px-3.5 pr-9 text-sm text-[var(--color-ink-900)]",
              "border-[var(--color-border-strong)] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/30 focus-visible:border-[var(--color-brand-500)]",
              error && "border-[var(--color-danger-500)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
        </div>
        {error && <p className="text-xs font-medium text-[var(--color-danger-500)]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
