import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Input } from "./Input";
import type { DateRange, DateRangePreset } from "../../types/revenue";
import { DATE_RANGE_PRESETS, presetLabel, resolveDateRange } from "../../utils/dateRange";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(value.start);
  const [customEnd, setCustomEnd] = useState(value.end);
  const [customError, setCustomError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 296) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      setCustomStart(value.start);
      setCustomEnd(value.end);
      setCustomError(null);
      setShowCustom(true);
      return;
    }
    onChange(resolveDateRange(preset));
    setOpen(false);
  }

  function applyCustom() {
    if (!customStart || !customEnd) {
      setCustomError("Select both a from and to date.");
      return;
    }
    if (customStart > customEnd) {
      setCustomError("From date cannot be after To date.");
      return;
    }
    onChange(resolveDateRange("custom", { start: customStart, end: customEnd }));
    setOpen(false);
    setShowCustom(false);
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-white px-3.5 py-2 text-sm font-medium text-[var(--color-ink-700)] hover:border-[var(--color-ink-400)]"
      >
        <Calendar className="size-4 text-[var(--color-ink-400)]" />
        {value.label}
        <ChevronDown className="size-4 text-[var(--color-ink-400)]" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: 288 }}
            className="z-[70] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-lg"
          >
            {!showCustom ? (
              <div className="flex flex-col py-1.5">
                {DATE_RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      "px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-canvas)]",
                      value.preset === preset ? "bg-[var(--color-brand-50)] font-medium text-[var(--color-brand-700)]" : "text-[var(--color-ink-700)]"
                    )}
                  >
                    {presetLabel(preset)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                <p className="text-sm font-medium text-[var(--color-ink-900)]">Custom range</p>
                <Input label="From" type="date" value={customStart} max={customEnd || undefined} onChange={(e) => { setCustomStart(e.target.value); setCustomError(null); }} />
                <Input label="To" type="date" value={customEnd} min={customStart || undefined} onChange={(e) => { setCustomEnd(e.target.value); setCustomError(null); }} />
                {customError && <p className="text-xs font-medium text-[var(--color-danger-500)]" role="alert">{customError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={() => setShowCustom(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={applyCustom}>
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
