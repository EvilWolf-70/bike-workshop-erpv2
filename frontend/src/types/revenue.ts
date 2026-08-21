export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start: string; // ISO date, inclusive
  end: string; // ISO date, inclusive
  label: string;
}

export type RevenueGranularity = "daily" | "weekly" | "monthly";

export interface RevenuePoint {
  key: string;
  label: string;
  revenue: number;
}

export interface RevenueSeries {
  range: DateRange;
  granularity: RevenueGranularity;
  points: RevenuePoint[];
  totalRevenue: number;
  billCount: number;
  /** True when the range is a single day — hourly breakdown was requested by
   * spec but isn't supported by the current data model (bill dates have no
   * time component), so this flags the UI to show a note rather than a
   * misleadingly granular-looking single-point line. */
  singleDayFallback: boolean;
}
