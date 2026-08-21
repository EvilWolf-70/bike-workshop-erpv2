import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Search, X, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export interface SearchSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  options: SearchSelectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  emptyMessage?: string;
  /** When provided, shows a pinned "+ createNewLabel" row at the bottom of the dropdown, always visible regardless of the search filter. */
  onCreateNew?: () => void;
  createNewLabel?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export function SearchSelect({
  label,
  placeholder = "Search…",
  error,
  options,
  value,
  onChange,
  emptyMessage = "No results found.",
  onCreateNew,
  createNewLabel = "Add new",
  disabled,
  disabledMessage,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = options.filter((o) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return o.label.toLowerCase().includes(term) || o.sublabel?.toLowerCase().includes(term);
  });

  // Dropdown is portal-rendered so it can't be clipped by a scrollable
  // ancestor (e.g. a tall dialog's internal scroll area) the way an
  // absolutely-positioned child of that container would be.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setOpen(false);
        setQuery("");
      }
    }
    function onDismiss() {
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onOutsideClick);
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("resize", onDismiss);
    };
  }, [open]);

  function select(optionId: string) {
    onChange(optionId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink-700)]">
          {label}
        </label>
      )}
      <div className="relative" ref={triggerRef}>
        {open ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <input
              id={id}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-brand-500)] bg-white pl-10 pr-3.5 text-sm outline-none ring-2 ring-[var(--color-brand-500)]/30"
            />
          </div>
        ) : (
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => setOpen(true)}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-[var(--radius-control)] border bg-white px-3.5 text-sm transition-colors",
              "border-[var(--color-border-strong)] hover:border-[var(--color-ink-400)]",
              error && "border-[var(--color-danger-500)]",
              disabled && "cursor-not-allowed bg-[var(--color-canvas)] text-[var(--color-ink-400)] hover:border-[var(--color-border-strong)]"
            )}
          >
            {selected ? (
              <span className="flex flex-col items-start text-left">
                <span className="text-[var(--color-ink-900)]">{selected.label}</span>
                {selected.sublabel && (
                  <span className="font-mono text-xs text-[var(--color-ink-500)]">{selected.sublabel}</span>
                )}
              </span>
            ) : (
              <span className="text-[var(--color-ink-400)]">{disabled && disabledMessage ? disabledMessage : placeholder}</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-[var(--color-ink-400)]" />
          </button>
        )}

        {selected && !open && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-700)]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
            className="z-[70] max-h-64 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <p className="px-3.5 py-3 text-sm text-[var(--color-ink-400)]">{emptyMessage}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => select(o.id)}
                  className={cn(
                    "flex w-full flex-col items-start px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-canvas)]",
                    o.id === value && "bg-[var(--color-brand-50)]"
                  )}
                >
                  <span className="text-[var(--color-ink-900)]">{o.label}</span>
                  {o.sublabel && <span className="font-mono text-xs text-[var(--color-ink-500)]">{o.sublabel}</span>}
                </button>
              ))
            )}
            {onCreateNew && (
              <>
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onCreateNew();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-[var(--color-brand-600)] transition-colors hover:bg-[var(--color-brand-50)]"
                >
                  <Plus className="size-4" />
                  {createNewLabel}
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
