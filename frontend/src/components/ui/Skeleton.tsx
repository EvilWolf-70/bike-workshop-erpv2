import type { CSSProperties } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--color-border)]", className)} style={style} />;
}

export function TableSkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className="h-4" style={{ width: `${55 + ((r + c * 7) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-danger-50)] text-[var(--color-danger-500)]">
        <AlertCircle className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)]">
          Couldn't load customers
        </h3>
        <p className="max-w-sm text-sm text-[var(--color-ink-500)]">{message}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
