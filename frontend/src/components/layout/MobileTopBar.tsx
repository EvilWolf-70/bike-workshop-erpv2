import { Menu, Wrench } from "lucide-react";

interface MobileTopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileTopBar({ title, onMenuClick }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 py-3.5 lg:hidden">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-[var(--color-ink-700)] hover:bg-[var(--color-canvas)]"
      >
        <Menu className="size-5.5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-[8px] bg-[var(--color-brand-500)] text-white">
          <Wrench className="size-3.5" />
        </div>
        <p className="font-[var(--font-display)] text-[15px] font-semibold text-[var(--color-ink-900)]">{title}</p>
      </div>
    </header>
  );
}
