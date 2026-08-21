import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, TrendingUp, Boxes, Users, Receipt } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Tabs } from "../../components/ui/Tabs";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import * as reportsService from "../../services/api/reportsService";
import { computeBillTotals } from "../../types/billing";
import { isLowStock } from "../../types/inventory";
import { exportReportPdf, exportReportExcel } from "../../utils/reportExport";
import type { ReportExportData } from "../../utils/reportExport";

type ReportTab = "Daily Sales" | "Monthly Sales" | "Inventory Summary" | "Customer Summary";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function currentMonthISO() {
  return new Date().toISOString().slice(0, 7);
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("Daily Sales");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">Sales, inventory, and customer summaries.</p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Daily Sales", label: "Daily Sales" },
          { value: "Monthly Sales", label: "Monthly Sales" },
          { value: "Inventory Summary", label: "Inventory Summary" },
          { value: "Customer Summary", label: "Customer Summary" },
        ]}
      />

      {tab === "Daily Sales" && <DailySalesPanel />}
      {tab === "Monthly Sales" && <MonthlySalesPanel />}
      {tab === "Inventory Summary" && <InventorySummaryPanel />}
      {tab === "Customer Summary" && <CustomerSummaryPanel />}
    </div>
  );
}

function ExportButtons({ getData, disabled }: { getData: () => ReportExportData; disabled?: boolean }) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  async function handleExport(kind: "pdf" | "excel") {
    setExporting(kind);
    try {
      const data = getData();
      if (kind === "pdf") await exportReportPdf(data);
      else await exportReportExcel(data);
    } catch {
      showToast("error", "Couldn't generate the export. Try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleExport("pdf")} loading={exporting === "pdf"} disabled={disabled}>
        <Download className="size-3.5" />
        Export PDF
      </Button>
      <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} loading={exporting === "excel"} disabled={disabled}>
        <FileSpreadsheet className="size-3.5" />
        Export Excel
      </Button>
    </div>
  );
}

function DailySalesPanel() {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState<reportsService.DailySalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.fetchDailySales(date).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [date]);

  const rows = (report?.bills ?? []).map((b) => {
    const totals = computeBillTotals(b);
    return [b.invoiceNumber, b.customerName, b.vehicleRegistration, b.paymentMethod, b.status, `Rs.${totals.grandTotal.toLocaleString("en-IN")}`];
  });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] p-4">
        <div className="w-48">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <ExportButtons
          disabled={!report || report.bills.length === 0}
          getData={() => ({
            title: "Daily Sales Report",
            subtitle: new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            columns: [
              { header: "Invoice" }, { header: "Customer" }, { header: "Vehicle" }, { header: "Payment" }, { header: "Status" }, { header: "Total", align: "right" },
            ],
            rows,
            summaryLines: [
              { label: "Total bills", value: String(report?.billCount ?? 0) },
              { label: "Total revenue", value: `Rs.${(report?.totalRevenue ?? 0).toLocaleString("en-IN")}` },
            ],
            fileBaseName: `daily-sales-${date}`,
          })}
        />
      </div>

      {loading || !report ? (
        <div className="flex flex-col gap-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : report.bills.length === 0 ? (
        <EmptyState icon={<Receipt className="size-6" />} title="No bills on this date" description="Try a different date." />
      ) : (
        <>
          <div className="flex gap-6 border-b border-[var(--color-border)] px-5 py-4 text-sm">
            <div>
              <span className="text-[var(--color-ink-500)]">Bills: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">{report.billCount}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Revenue: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">₹{report.totalRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Invoice</TableTh>
                <TableTh>Customer</TableTh>
                <TableTh>Vehicle</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Total</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {report.bills.map((b) => {
                const totals = computeBillTotals(b);
                return (
                  <TableRow key={b.id}>
                    <TableTd className="font-mono">{b.invoiceNumber}</TableTd>
                    <TableTd>{b.customerName}</TableTd>
                    <TableTd className="font-mono">{b.vehicleRegistration}</TableTd>
                    <TableTd>
                      <Badge tone={b.status === "Paid" ? "success" : "warning"}>{b.status}</Badge>
                    </TableTd>
                    <TableTd className="text-right font-medium">₹{totals.grandTotal.toLocaleString("en-IN")}</TableTd>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}

function MonthlySalesPanel() {
  const [month, setMonth] = useState(currentMonthISO());
  const [report, setReport] = useState<reportsService.MonthlySalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.fetchMonthlySales(month).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [month]);

  const rows = (report?.days ?? []).map((d) => [
    new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    String(d.billCount),
    `Rs.${d.revenue.toLocaleString("en-IN")}`,
  ]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] p-4">
        <div className="w-48">
          <Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <ExportButtons
          disabled={!report || report.days.length === 0}
          getData={() => ({
            title: "Monthly Sales Report",
            subtitle: new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
            columns: [{ header: "Date" }, { header: "Bills" }, { header: "Revenue", align: "right" }],
            rows,
            summaryLines: [
              { label: "Total bills", value: String(report?.billCount ?? 0) },
              { label: "Total revenue", value: `Rs.${(report?.totalRevenue ?? 0).toLocaleString("en-IN")}` },
            ],
            fileBaseName: `monthly-sales-${month}`,
          })}
        />
      </div>

      {loading || !report ? (
        <div className="flex flex-col gap-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : report.days.length === 0 ? (
        <EmptyState icon={<TrendingUp className="size-6" />} title="No sales this month" description="Try a different month." />
      ) : (
        <>
          <div className="flex gap-6 border-b border-[var(--color-border)] px-5 py-4 text-sm">
            <div>
              <span className="text-[var(--color-ink-500)]">Bills: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">{report.billCount}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Revenue: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">₹{report.totalRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Date</TableTh>
                <TableTh>Bills</TableTh>
                <TableTh className="text-right">Revenue</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {report.days.map((d) => (
                <TableRow key={d.date}>
                  <TableTd>{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</TableTd>
                  <TableTd>{d.billCount}</TableTd>
                  <TableTd className="text-right font-medium">₹{d.revenue.toLocaleString("en-IN")}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}

function InventorySummaryPanel() {
  const [report, setReport] = useState<reportsService.InventorySummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.fetchInventorySummary().then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, []);

  const rows = (report?.items ?? []).map((i) => [
    i.name,
    i.category,
    String(i.quantity),
    `Rs.${i.purchasePrice.toLocaleString("en-IN")}`,
    `Rs.${i.sellingPrice.toLocaleString("en-IN")}`,
    `Rs.${(i.quantity * i.purchasePrice).toLocaleString("en-IN")}`,
  ]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
        <p className="text-sm text-[var(--color-ink-500)]">Current stock valued at purchase and selling price.</p>
        <ExportButtons
          disabled={!report || report.items.length === 0}
          getData={() => ({
            title: "Inventory Summary Report",
            subtitle: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            columns: [
              { header: "Item" }, { header: "Category" }, { header: "Qty" }, { header: "Purchase Price", align: "right" }, { header: "Selling Price", align: "right" }, { header: "Stock Value", align: "right" },
            ],
            rows,
            summaryLines: [
              { label: "Total items", value: String(report?.items.length ?? 0) },
              { label: "Low stock items", value: String(report?.lowStockCount ?? 0) },
              { label: "Total stock value", value: `Rs.${(report?.totalStockValue ?? 0).toLocaleString("en-IN")}` },
            ],
            fileBaseName: `inventory-summary-${todayISO()}`,
          })}
        />
      </div>

      {loading || !report ? (
        <div className="flex flex-col gap-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : report.items.length === 0 ? (
        <EmptyState icon={<Boxes className="size-6" />} title="No inventory yet" description="Add items in Inventory to see them here." />
      ) : (
        <>
          <div className="flex flex-wrap gap-6 border-b border-[var(--color-border)] px-5 py-4 text-sm">
            <div>
              <span className="text-[var(--color-ink-500)]">Items: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">{report.items.length}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Low stock: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">{report.lowStockCount}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Stock value (purchase): </span>
              <span className="font-semibold text-[var(--color-ink-900)]">₹{report.totalStockValue.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Potential revenue (selling): </span>
              <span className="font-semibold text-[var(--color-ink-900)]">₹{report.totalPotentialRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Item</TableTh>
                <TableTh>Category</TableTh>
                <TableTh>Stock</TableTh>
                <TableTh className="text-right">Stock value</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {report.items.map((i) => (
                <TableRow key={i.id}>
                  <TableTd>{i.name}</TableTd>
                  <TableTd>
                    <Badge tone="neutral">{i.category}</Badge>
                  </TableTd>
                  <TableTd>
                    <span className={isLowStock(i) ? "font-medium text-[var(--color-danger-500)]" : ""}>{i.quantity}</span>
                  </TableTd>
                  <TableTd className="text-right font-medium">₹{(i.quantity * i.purchasePrice).toLocaleString("en-IN")}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}

function CustomerSummaryPanel() {
  const [report, setReport] = useState<reportsService.CustomerSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.fetchCustomerSummary().then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, []);

  const rows = (report?.customers ?? []).map((c) => [c.name, c.phone, String(c.vehicleCount), String(c.totalJobs), `Rs.${c.totalSpend.toLocaleString("en-IN")}`]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
        <p className="text-sm text-[var(--color-ink-500)]">Ranked by total spend.</p>
        <ExportButtons
          disabled={!report || report.customers.length === 0}
          getData={() => ({
            title: "Customer Summary Report",
            subtitle: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            columns: [{ header: "Customer" }, { header: "Phone" }, { header: "Vehicles" }, { header: "Jobs" }, { header: "Total Spend", align: "right" }],
            rows,
            summaryLines: [
              { label: "Total customers", value: String(report?.totalCustomers ?? 0) },
              { label: "Total lifetime revenue", value: `Rs.${(report?.totalLifetimeRevenue ?? 0).toLocaleString("en-IN")}` },
            ],
            fileBaseName: `customer-summary-${todayISO()}`,
          })}
        />
      </div>

      {loading || !report ? (
        <div className="flex flex-col gap-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : report.customers.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="No customers yet" description="Add customers to see them here." />
      ) : (
        <>
          <div className="flex gap-6 border-b border-[var(--color-border)] px-5 py-4 text-sm">
            <div>
              <span className="text-[var(--color-ink-500)]">Customers: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">{report.totalCustomers}</span>
            </div>
            <div>
              <span className="text-[var(--color-ink-500)]">Lifetime revenue: </span>
              <span className="font-semibold text-[var(--color-ink-900)]">₹{report.totalLifetimeRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Customer</TableTh>
                <TableTh>Vehicles</TableTh>
                <TableTh>Jobs</TableTh>
                <TableTh className="text-right">Total spend</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {report.customers.map((c) => (
                <TableRow key={c.id}>
                  <TableTd>
                    <span className="block">{c.name}</span>
                    <span className="block font-mono text-xs text-[var(--color-ink-500)]">{c.phone}</span>
                  </TableTd>
                  <TableTd>{c.vehicleCount}</TableTd>
                  <TableTd>{c.totalJobs}</TableTd>
                  <TableTd className="text-right font-medium">₹{c.totalSpend.toLocaleString("en-IN")}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}
