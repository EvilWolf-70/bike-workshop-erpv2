import { IndianRupee, Receipt, Wrench, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatCard } from "./StatCard";
import { RevenueChartCard } from "./RevenueChartCard";
import { useDashboardData } from "../../hooks/useDashboardData";
import { computeBillTotals } from "../../types/billing";
import type { NavPage } from "../../components/layout/Sidebar";

export function DashboardPage({ onNavigate }: { onNavigate: (page: NavPage) => void }) {
  const { data, status, error, reload } = useDashboardData();

  if (status === "error") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Dashboard</h1>
        <Card className="p-0">
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {status === "loading" || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2.5 h-7 w-16" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Today's Revenue"
              value={`₹${data.todaysRevenue.toLocaleString("en-IN")}`}
              icon={<IndianRupee className="size-5" />}
            />
            <StatCard label="Today's Bills" value={String(data.todaysBillCount)} icon={<Receipt className="size-5" />} />
            <StatCard
              label="Pending Jobs"
              value={String(data.pendingJobCount)}
              icon={<Wrench className="size-5" />}
              hint="Pending + In Progress"
            />
            <StatCard
              label="Inventory Alerts"
              value={String(data.lowStockItems.length)}
              icon={<AlertTriangle className="size-5" />}
              tone={data.lowStockItems.length > 0 ? "warning" : "neutral"}
              hint={data.lowStockItems.length > 0 ? data.lowStockItems.map((i) => i.name).slice(0, 2).join(", ") + (data.lowStockItems.length > 2 ? "…" : "") : "All stocked"}
            />
          </>
        )}
      </div>

      <RevenueChartCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink-900)]">Recent Bills</h2>
            <button onClick={() => onNavigate("Billing")} className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] hover:underline">
              View all <ArrowRight className="size-3" />
            </button>
          </div>
          {status === "loading" || !data ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data.recentBills.length === 0 ? (
            <EmptyState icon={<Receipt className="size-6" />} title="No bills yet" description="Bills you create will show up here." />
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {data.recentBills.map((b) => {
                const totals = computeBillTotals(b);
                return (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-mono text-sm font-medium text-[var(--color-ink-900)]">{b.invoiceNumber}</p>
                      <p className="text-xs text-[var(--color-ink-500)]">{b.customerName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={b.status === "Paid" ? "success" : "warning"}>{b.status}</Badge>
                      <span className="w-20 text-right text-sm font-medium text-[var(--color-ink-900)]">
                        ₹{totals.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink-900)]">Recent Customers</h2>
            <button onClick={() => onNavigate("Customers")} className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] hover:underline">
              View all <ArrowRight className="size-3" />
            </button>
          </div>
          {status === "loading" || !data ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data.recentCustomers.length === 0 ? (
            <EmptyState icon={<Wrench className="size-6" />} title="No customers yet" description="Customers you add will show up here." />
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {data.recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-brand-50)] font-[var(--font-display)] text-xs font-bold text-[var(--color-brand-600)]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink-900)]">{c.name}</p>
                      <p className="font-mono text-xs text-[var(--color-ink-500)]">{c.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-ink-400)]">
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "New"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
