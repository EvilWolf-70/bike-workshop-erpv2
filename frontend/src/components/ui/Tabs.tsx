import { cn } from "../../utils/cn";

interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ options, value, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-[var(--color-brand-500)] text-white"
              : "bg-[var(--color-canvas)] text-[var(--color-ink-500)] hover:bg-[var(--color-border)]"
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none",
                value === opt.value ? "bg-white/25" : "bg-white text-[var(--color-ink-500)]"
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
