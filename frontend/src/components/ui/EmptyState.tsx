import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-500)]">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)]">{title}</h3>
        <p className="max-w-sm text-sm text-[var(--color-ink-500)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
