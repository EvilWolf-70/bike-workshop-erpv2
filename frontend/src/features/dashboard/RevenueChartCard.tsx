import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton, ErrorBanner } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { LineChart } from "../../components/ui/LineChart";
import * as reportsService from "../../services/api/reportsService";
import { resolveDateRange } from "../../utils/dateRange";
import type { DateRange, RevenueSeries } from "../../types/revenue";

export function RevenueChartCard() {
  const [range, setRange] = useState<DateRange>(() => resolveDateRange("last7"));
  const [series, setSeries] = useState<RevenueSeries | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  async function load(r: DateRange) {
    setStatus("loading");
    setError(null);
    try {
      const data = await reportsService.fetchRevenueSeries(r);
      setSeries(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong loading revenue.");
      setStatus("error");
    }
  }

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const hasData = !!series && series.points.some((p) => p.revenue > 0);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <h2 className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink-900)]">Revenue Overview</h2>
          <p className="text-xs text-[var(--color-ink-500)]">Track workshop revenue across a selected period.</p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {status === "loading" ? (
        <div className="flex flex-col gap-4 p-5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : status === "error" ? (
        <ErrorBanner message={error ?? "Something went wrong."} onRetry={() => load(range)} />
      ) : !hasData ? (
        <EmptyState
          icon={<TrendingUp className="size-6" />}
          title="No revenue in this period"
          description={`No bills were created between ${series?.range.start} and ${series?.range.end}. Try a different range.`}
        />
      ) : (
        <div className="p-5">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">
              ₹{series!.totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-[var(--color-ink-500)]">
              {series!.billCount} {series!.billCount === 1 ? "bill" : "bills"} · {series!.range.label}
            </span>
          </div>
          {series!.singleDayFallback && (
            <p className="mb-2 text-xs text-[var(--color-ink-400)]">
              Hourly breakdown isn't available yet — showing the day's total.
            </p>
          )}
          <LineChart
            points={series!.points.map((p) => ({ label: p.label, value: p.revenue }))}
            valueFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
          />
        </div>
      )}
    </Card>
  );
}
