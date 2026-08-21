import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface RowMenuAction {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface RowActionsMenuProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  actions: RowMenuAction[];
}

const MENU_WIDTH = 176; // matches w-44

/**
 * Renders the dropdown in a portal, positioned via the trigger button's
 * bounding rect. Table cells live inside an overflow-x-auto scroll
 * container, and any browser that sets overflow-x also implicitly clips
 * overflow-y — an absolutely-positioned dropdown inside that container
 * would get cut off. This sidesteps that entirely, which matters most on
 * mobile where tables scroll horizontally far more often.
 */
export function RowActionsMenu({ label, open, onToggle, onClose, actions }: RowActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
    setCoords({ top: rect.bottom + 4, left: Math.max(8, left) });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const handleDismiss = () => onClose();
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open, onClose]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        className="rounded-md p-1.5 text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-700)]"
      >
        <MoreVertical className="size-4" />
      </button>
      {open &&
        coords &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} onScroll={onClose} />
            <div
              style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-50 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white py-1 shadow-lg"
            >
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
                    action.danger
                      ? "text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                      : "text-[var(--color-ink-700)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
