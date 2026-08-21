import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        "shadow-[0_1px_2px_rgba(18,20,28,0.04),0_8px_24px_-12px_rgba(18,20,28,0.08)]",
        className
      )}
      {...props}
    />
  );
}
