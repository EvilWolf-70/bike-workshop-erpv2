import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--color-canvas)] text-[var(--color-ink-500)] border-[var(--color-border-strong)]",
  brand: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-transparent",
  success: "bg-[var(--color-success-50)] text-[var(--color-success-500)] border-transparent",
  warning: "bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-transparent",
  danger: "bg-[var(--color-danger-50)] text-[var(--color-danger-500)] border-transparent",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
