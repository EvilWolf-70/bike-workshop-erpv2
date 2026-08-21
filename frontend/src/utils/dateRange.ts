import type { DateRange, DateRangePreset, RevenueGranularity } from "../types/revenue";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 Days",
  last30: "Last 30 Days",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  thisYear: "This Year",
  custom: "Custom Range",
};

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "custom",
];

export function presetLabel(preset: DateRangePreset): string {
  return PRESET_LABELS[preset];
}

/** Resolves a preset (or explicit custom start/end) into concrete ISO date boundaries, using the real current date. */
export function resolveDateRange(preset: DateRangePreset, custom?: { start: string; end: string }): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { preset, start: toISODate(today), end: toISODate(today), label: PRESET_LABELS.today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { preset, start: toISODate(y), end: toISODate(y), label: PRESET_LABELS.yesterday };
    }
    case "last7":
      return { preset, start: toISODate(addDays(today, -6)), end: toISODate(today), label: PRESET_LABELS.last7 };
    case "last30":
      return { preset, start: toISODate(addDays(today, -29)), end: toISODate(today), label: PRESET_LABELS.last30 };
    case "thisMonth":
      return { preset, start: toISODate(startOfMonth(today)), end: toISODate(today), label: PRESET_LABELS.thisMonth };
    case "lastMonth": {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return {
        preset,
        start: toISODate(startOfMonth(lastMonthDate)),
        end: toISODate(endOfMonth(lastMonthDate)),
        label: PRESET_LABELS.lastMonth,
      };
    }
    case "thisYear":
      return { preset, start: toISODate(new Date(today.getFullYear(), 0, 1)), end: toISODate(today), label: PRESET_LABELS.thisYear };
    case "custom": {
      if (!custom || !custom.start || !custom.end) {
        // Falls back to today rather than throwing — callers validate before reaching here.
        return { preset, start: toISODate(today), end: toISODate(today), label: PRESET_LABELS.custom };
      }
      const start = custom.start <= custom.end ? custom.start : custom.end;
      const end = custom.start <= custom.end ? custom.end : custom.start;
      return { preset, start, end, label: `${formatShort(start)} – ${formatShort(end)}` };
    }
  }
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function daySpan(range: DateRange): number {
  const start = new Date(range.start);
  const end = new Date(range.end);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** Chooses aggregation granularity so the x-axis never gets overcrowded, per spec section 6. */
export function chooseGranularity(range: DateRange): RevenueGranularity {
  const span = daySpan(range);
  if (span <= 31) return "daily";
  if (span <= 120) return "weekly";
  return "monthly";
}

function isoWeekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay() === 0 ? 7 : copy.getDay(); // Monday = 1 ... Sunday = 7
  copy.setDate(copy.getDate() - (day - 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Every bucket key in the range, including ones with zero bills — so gaps show as zero, not as missing points. */
export function generateBucketKeys(range: DateRange, granularity: RevenueGranularity): string[] {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const keys: string[] = [];

  if (granularity === "daily") {
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) keys.push(toISODate(d));
  } else if (granularity === "weekly") {
    let d = isoWeekStart(start);
    while (d <= end) {
      keys.push(toISODate(d));
      d = addDays(d, 7);
    }
  } else {
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (d <= endMonth) {
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  return keys;
}

/** Maps a bill's date to the bucket key it belongs in, matching generateBucketKeys' key format. */
export function bucketKeyFor(dateISO: string, granularity: RevenueGranularity): string {
  if (granularity === "monthly") return dateISO.slice(0, 7);
  if (granularity === "daily") return dateISO;
  return toISODate(isoWeekStart(new Date(dateISO)));
}

export function bucketLabel(key: string, granularity: RevenueGranularity): string {
  if (granularity === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  // daily and weekly both key off a concrete date; weekly labels the week's start date
  return new Date(key).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
