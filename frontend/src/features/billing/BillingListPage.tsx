import { useState } from "react";
import { Plus, Search, Receipt, Download, CheckCircle2, Trash2, CircleDollarSign, Share2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeletonRows, ErrorBanner } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { useToast } from "../../components/ui/Toast";
import { useBills } from "../../hooks/useBills";
import { useDebounce } from "../../hooks/useDebounce";
import { BillFormDialog } from "./BillFormDialog";
import { BillCreatedSuccessDialog } from "./BillCreatedSuccessDialog";
import { InvoiceShareMenu } from "./InvoiceShareMenu";
import type { Bill, BillInput } from "../../types/billing";
import { computeBillTotals } from "../../types/billing";
import { generateInvoicePdf } from "../../utils/invoicePdf";
import * as settingsService from "../../services/api/settingsService";

export function BillingListPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 250);
  const { bills, status, error, reload, create, setPaidStatus, remove } = useBills(debouncedSearch);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [successBill, setSuccessBill] = useState<Bill | null>(null);
  const [shareTarget, setShareTarget] = useState<Bill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleSubmit(input: BillInput) {
    const created = await create(input);
    setSuccessBill(created);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      showToast("success", `${deleteTarget.invoiceNumber} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't delete bill.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleTogglePaid(bill: Bill) {
    setOpenMenuId(null);
    const next = bill.status === "Paid" ? "Unpaid" : "Paid";
    try {
      await setPaidStatus(bill.id, next);
      showToast("success", `${bill.invoiceNumber} marked as ${next.toLowerCase()}.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't update bill status.");
    }
  }

  async function handleDownload(bill: Bill) {
    setOpenMenuId(null);
    setDownloadingId(bill.id);
    try {
      const workshop = await settingsService.fetchWorkshopProfile();
      await generateInvoicePdf(bill, workshop);
    } catch {
      showToast("error", "Couldn't generate the PDF. Try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Billing</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Generate invoices from completed job cards.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          New bill
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input
              placeholder="Search by invoice #, job #, or customer"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search bills"
            />
          </div>
        </div>

        {status === "error" ? (
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        ) : status === "success" && bills.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching bills"
              description={`Nothing matches "${debouncedSearch}".`}
            />
          ) : (
            <EmptyState
              icon={<Receipt className="size-6" />}
              title="No bills yet"
              description="Create a bill once a job card is completed to generate an invoice."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)} className="mt-1">
                  <Plus className="size-4" />
                  New bill
                </Button>
              }
            />
          )
        ) : (
          <Table maxHeight="65vh">
            <TableHead sticky>
              <tr>
                <TableTh>Invoice</TableTh>
                <TableTh>Customer & vehicle</TableTh>
                <TableTh className="hidden sm:table-cell">Payment</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Total</TableTh>
                <TableTh className="w-12" />
              </tr>
            </TableHead>
            <TableBody>
              {status === "loading" ? (
                <TableSkeletonRows rows={4} cols={6} />
              ) : (
                bills.map((b) => {
                  const totals = computeBillTotals(b);
                  return (
                    <TableRow key={b.id}>
                      <TableTd>
                        <span className="block font-mono text-sm font-semibold text-[var(--color-ink-900)]">{b.invoiceNumber}</span>
                        <span className="block text-xs text-[var(--color-ink-500)]">
                          {b.jobCardNumber} · {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </TableTd>
                      <TableTd>
                        <span className="block text-[var(--color-ink-900)]">{b.customerName}</span>
                        <span className="block font-mono text-xs text-[var(--color-ink-500)]">{b.vehicleRegistration}</span>
                      </TableTd>
                      <TableTd className="hidden sm:table-cell">{b.paymentMethod}</TableTd>
                      <TableTd>
                        <Badge tone={b.status === "Paid" ? "success" : "warning"}>{b.status}</Badge>
                      </TableTd>
                      <TableTd className="text-right font-medium text-[var(--color-ink-900)]">
                        ₹{totals.grandTotal.toLocaleString("en-IN")}
                      </TableTd>
                      <TableTd className="relative">
                        <RowActionsMenu
                          label={`Actions for ${b.invoiceNumber}`}
                          open={openMenuId === b.id}
                          onToggle={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                          onClose={() => setOpenMenuId(null)}
                          actions={[
                            {
                              key: "share",
                              icon: <Share2 className="size-4" />,
                              label: "Share",
                              onClick: () => { setShareTarget(b); setOpenMenuId(null); },
                            },
                            {
                              key: "download",
                              icon: <Download className="size-4" />,
                              label: downloadingId === b.id ? "Preparing…" : "Download PDF",
                              onClick: () => handleDownload(b),
                            },
                            {
                              key: "toggle-paid",
                              icon: b.status === "Paid" ? <CircleDollarSign className="size-4" /> : <CheckCircle2 className="size-4" />,
                              label: b.status === "Paid" ? "Mark as unpaid" : "Mark as paid",
                              onClick: () => handleTogglePaid(b),
                            },
                            {
                              key: "delete",
                              icon: <Trash2 className="size-4" />,
                              label: "Delete",
                              danger: true,
                              onClick: () => { setDeleteTarget(b); setOpenMenuId(null); },
                            },
                          ]}
                        />
                      </TableTd>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <BillFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <BillCreatedSuccessDialog open={!!successBill} onClose={() => setSuccessBill(null)} bill={successBill} />
      {shareTarget && <InvoiceShareMenu open={!!shareTarget} onClose={() => setShareTarget(null)} bill={shareTarget} />}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete bill?"
        description={`This permanently removes invoice ${deleteTarget?.invoiceNumber ?? ""}. The job card stays on record and becomes billable again.`}
        confirmLabel="Delete bill"
      />
    </div>
  );
}
