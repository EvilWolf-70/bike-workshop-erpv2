import type { ReactNode } from "react";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "neutral" | "warning";
  hint?: string;
}

export function StatCard({ label, value, icon, tone = "neutral", hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-ink-500)]">{label}</p>
          <p className="mt-1.5 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">{value}</p>
          {hint && <p className="mt-1 text-xs text-[var(--color-ink-400)]">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
            tone === "warning" ? "bg-[var(--color-amber-50)] text-[var(--color-amber-700)]" : "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
