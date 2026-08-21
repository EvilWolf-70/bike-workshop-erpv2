import type { Bill } from "../types/billing";
import { computeBillTotals } from "../types/billing";
import type { WorkshopProfile } from "../types/settings";
import * as customerService from "./api/customerService";
import { generateInvoicePdf, buildInvoicePdfBlob } from "../utils/invoicePdf";

/**
 * PLACEHOLDER LINK — there is no backend hosting or routing for individual
 * invoice pages yet (this is a client-side SPA with page-state navigation,
 * not URL routing; see CLAUDE_UI_UPDATES.md section 15/23 on Supabase not
 * being wired up yet). This produces the URL structure the app WOULD route
 * to once that page exists — keyed by invoice number, never a raw database
 * id — so swapping in a real signed URL later is a one-line change here,
 * not a redesign. It does not currently resolve to a working page. Treat
 * "Copy Link" as reserving the shape of the feature, not delivering it.
 */
export function getInvoiceShareUrl(bill: Bill): string {
  return `${window.location.origin}/invoices/${encodeURIComponent(bill.invoiceNumber)}`;
}

function shareText(bill: Bill, workshop: WorkshopProfile): string {
  const totals = computeBillTotals(bill);
  const firstName = bill.customerName.split(" ")[0];
  return [
    `Hi ${firstName}, here's your invoice from ${workshop.workshopName}.`,
    ``,
    `Invoice: ${bill.invoiceNumber}`,
    `Vehicle: ${bill.vehicleRegistration}`,
    `Amount: ₹${totals.grandTotal.toLocaleString("en-IN")}`,
    `Status: ${bill.status}`,
    ``,
    `Thank you for choosing us!`,
  ].join("\n");
}

/**
 * Resolves the customer's saved WhatsApp number for this bill. Bills only
 * snapshot customerPhone (not customerId or whatsapp specifically), so this
 * looks the live customer record up by phone via the existing
 * findCustomerByPhone helper rather than adding new fields to Bill.
 */
async function resolveWhatsAppNumber(bill: Bill): Promise<string> {
  const customer = await customerService.findCustomerByPhone(bill.customerPhone);
  return (customer?.whatsapp || bill.customerPhone).replace(/\D/g, "");
}

export type ShareOutcome = "sent" | "cancelled" | "unsupported";

/**
 * Opens WhatsApp with pre-filled text via the wa.me click-to-chat link.
 * WhatsApp's web/click-to-chat flow only supports pre-filled TEXT, never a
 * file attachment — that's a platform limitation, not something a richer
 * implementation could work around. The message does not include the
 * placeholder invoice link (see getInvoiceShareUrl) since it doesn't
 * resolve to anything real yet; it points the customer to the PDF the
 * workshop is expected to attach manually after downloading it.
 */
export async function shareViaWhatsApp(bill: Bill, workshop: WorkshopProfile): Promise<ShareOutcome> {
  const number = await resolveWhatsAppNumber(bill);
  if (!number) return "unsupported";
  const text = encodeURIComponent(shareText(bill, workshop) + "\n\n(Invoice PDF attached separately.)");
  window.open(`https://wa.me/${number}?text=${text}`, "_blank", "noopener,noreferrer");
  return "sent";
}

/**
 * Opens a mailto: draft. Browsers do not support attaching files via
 * mailto: links at all — another platform limitation, not a gap in this
 * implementation — so the body asks the sender to attach the downloaded
 * PDF before sending. The Customer record has no email field today, so
 * the "to" address is left blank for the sender to fill in rather than
 * inventing a field this spec didn't ask for.
 */
export function shareViaEmail(bill: Bill, workshop: WorkshopProfile): ShareOutcome {
  const subject = encodeURIComponent(`Invoice ${bill.invoiceNumber} from ${workshop.workshopName}`);
  const body = encodeURIComponent(shareText(bill, workshop) + "\n\n(Please attach the downloaded invoice PDF before sending.)");
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  return "sent";
}

export async function copyInvoiceLink(bill: Bill): Promise<void> {
  await navigator.clipboard.writeText(getInvoiceShareUrl(bill));
}

export function isNativeShareSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Shares via the OS-level share sheet, attaching the real PDF file when the platform supports file sharing (Web Share API Level 2). Falls back to text+link when it doesn't. */
export async function shareNative(bill: Bill, workshop: WorkshopProfile): Promise<ShareOutcome> {
  if (!isNativeShareSupported()) return "unsupported";

  const text = shareText(bill, workshop);
  try {
    const blob = await buildInvoicePdfBlob(bill, workshop);
    const file = new File([blob], `${bill.invoiceNumber}.pdf`, { type: "application/pdf" });
    const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

    if (canShareFiles) {
      await navigator.share({ title: `Invoice ${bill.invoiceNumber}`, text, files: [file] });
    } else {
      await navigator.share({ title: `Invoice ${bill.invoiceNumber}`, text });
    }
    return "sent";
  } catch (err) {
    // AbortError means the person cancelled the native share sheet — not a failure.
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    throw err;
  }
}

export async function downloadInvoicePdf(bill: Bill, workshop: WorkshopProfile): Promise<void> {
  await generateInvoicePdf(bill, workshop);
}

/**
 * Opens the invoice PDF in a new tab. Builds the PDF blob first, then
 * opens the window — NOT the more usual "open blank tab immediately, then
 * navigate it once ready" pattern. That pattern was tried and reliably
 * failed here: loading/initializing jsPDF between opening the window and
 * navigating it broke the previously-opened window's navigability (most
 * likely from jsPDF's internal canvas/DOM work during module init — this
 * was confirmed by bisection, not assumed). If the browser's popup blocker
 * still blocks this call, it falls back to a direct download so the
 * person gets the invoice either way rather than nothing.
 */
export async function openInvoicePdfInNewTab(bill: Bill, workshop: WorkshopProfile): Promise<"opened" | "downloaded"> {
  const blob = await buildInvoicePdfBlob(bill, workshop);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  let outcome: "opened" | "downloaded" = "opened";
  if (!win) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bill.invoiceNumber}.pdf`;
    link.click();
    outcome = "downloaded";
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return outcome;
}
