import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-sm shadow-brand-500/20",
  secondary:
    "bg-white text-[var(--color-ink-700)] border border-[var(--color-border-strong)] hover:bg-[var(--color-canvas)]",
  ghost: "bg-transparent text-[var(--color-ink-700)] hover:bg-[var(--color-canvas)]",
  danger: "bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-600)] shadow-sm shadow-danger-500/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium",
          "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          "whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
