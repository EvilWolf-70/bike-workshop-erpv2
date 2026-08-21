import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface TableProps {
  className?: string;
  children: ReactNode;
  /**
   * Bounds the table to a max height (e.g. "60vh") with the header pinned
   * while both axes scroll inside one container. Opt-in and only worth
   * using once a table's real row count justifies it — sticky headers
   * don't reliably combine with horizontal scroll unless the same element
   * owns both scroll axes, so this isn't just a style toggle.
   */
  maxHeight?: string;
}

export function Table({ className, children, maxHeight }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", maxHeight && "overflow-y-auto")} style={maxHeight ? { maxHeight } : undefined}>
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHead({ children, sticky }: { children: ReactNode; sticky?: boolean }) {
  return (
    <thead className={cn("border-b border-[var(--color-border)]", sticky && "sticky top-0 z-10 bg-[var(--color-surface)]")}>
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("group transition-colors hover:bg-[var(--color-canvas)]/70", className)} {...props} />;
}

export function TableTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-400)]",
        className
      )}
      {...props}
    />
  );
}

export function TableTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-[var(--color-ink-700)]", className)} {...props} />;
}
