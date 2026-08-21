import { useState } from "react";
import { CheckCircle2, Share2, Eye, Download, Printer } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import type { Bill } from "../../types/billing";
import { computeBillTotals } from "../../types/billing";
import * as settingsService from "../../services/api/settingsService";
import * as shareService from "../../services/invoiceShareService";
import { InvoiceShareMenu } from "./InvoiceShareMenu";

interface BillCreatedSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export function BillCreatedSuccessDialog({ open, onClose, bill }: BillCreatedSuccessDialogProps) {
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState<"view" | "download" | "print" | null>(null);

  if (!bill) return null;
  const totals = computeBillTotals(bill);

  async function handleView() {
    setBusy("view");
    try {
      const workshop = await settingsService.fetchWorkshopProfile();
      const outcome = await shareService.openInvoicePdfInNewTab(bill!, workshop);
      if (outcome === "downloaded") {
        showToast("success", "Your browser blocked the popup, so the invoice was downloaded instead.");
      }
    } catch {
      showToast("error", "Couldn't open the invoice. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const workshop = await settingsService.fetchWorkshopProfile();
      await shareService.downloadInvoicePdf(bill!, workshop);
      showToast("success", "Invoice PDF downloaded.");
    } catch {
      showToast("error", "Couldn't generate the PDF. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    setBusy("print");
    try {
      const workshop = await settingsService.fetchWorkshopProfile();
      const outcome = await shareService.openInvoicePdfInNewTab(bill!, workshop);
      showToast(
        "success",
        outcome === "opened" ? "Invoice opened — use your browser's print option." : "Your browser blocked the popup, so the invoice was downloaded instead."
      );
    } catch {
      showToast("error", "Couldn't open the invoice. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Bill created" size="sm">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-success-50)]">
            <CheckCircle2 className="size-7 text-[var(--color-success-500)]" />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">{bill.invoiceNumber}</p>
            <p className="text-sm text-[var(--color-ink-500)]">{bill.customerName} · {bill.vehicleRegistration}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">
              ₹{totals.grandTotal.toLocaleString("en-IN")}
            </span>
            <Badge tone={bill.status === "Paid" ? "success" : "warning"}>{bill.status}</Badge>
          </div>

          <Button size="lg" className="mt-2 w-full" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" />
            Share Bill
          </Button>

          <div className="grid w-full grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={handleView} loading={busy === "view"}>
              <Eye className="size-3.5" />
              View
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload} loading={busy === "download"}>
              <Download className="size-3.5" />
              Download
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint} loading={busy === "print"}>
              <Printer className="size-3.5" />
              Print
            </Button>
          </div>

          <button onClick={onClose} className="mt-1 text-sm text-[var(--color-ink-500)] hover:underline">
            Done
          </button>
        </div>
      </Dialog>

      <InvoiceShareMenu open={shareOpen} onClose={() => setShareOpen(false)} bill={bill} layer="top" />
    </>
  );
}
