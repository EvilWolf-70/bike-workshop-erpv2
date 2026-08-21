import type { Bill } from "../types/billing";
import { computeBillTotals } from "../types/billing";
import type { WorkshopProfile } from "../types/settings";

const INK = "#12141C";
const MUTED = "#656B7C";
const BRAND = "#2455E0";
const BORDER = "#E5E8EF";

/**
 * Builds the invoice PDF document (all drawing logic) without saving it
 * anywhere. Shared by generateInvoicePdf (download) and buildInvoicePdfBlob
 * (sharing) so there is exactly one invoice design, not two.
 */
async function buildInvoiceDoc(bill: Bill, workshop: WorkshopProfile) {
  // Lazy-loaded: jsPDF (and its optional html2canvas dependency) is only
  // needed the moment someone downloads an invoice, not on initial page load.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 48;

  // --- Header: workshop identity ---
  if (workshop.logoDataUrl) {
    try {
      const format = workshop.logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(workshop.logoDataUrl, format, margin, y - 20, 34, 34, undefined, "FAST");
    } catch {
      drawLogoPlaceholder();
    }
  } else {
    drawLogoPlaceholder();
  }

  function drawLogoPlaceholder() {
    doc.setFillColor(BRAND);
    doc.roundedRect(margin, y - 20, 34, 34, 6, 6, "F");
    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(workshop.workshopName.charAt(0).toUpperCase(), margin + 17, y + 3, { align: "center" });
  }

  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(workshop.workshopName, margin + 46, y - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(workshop.address, margin + 46, y + 10);
  doc.text(`Phone: ${workshop.phone}   GSTIN: ${workshop.gstNumber}`, margin + 46, y + 22);

  // --- Invoice title block (right aligned) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(INK);
  doc.text("TAX INVOICE", pageWidth - margin, y - 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  doc.text(`Invoice #: ${bill.invoiceNumber}`, pageWidth - margin, y + 12, { align: "right" });
  doc.text(
    `Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    pageWidth - margin,
    y + 24,
    { align: "right" }
  );

  y += 56;
  doc.setDrawColor(BORDER);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // --- Customer & vehicle details, two columns ---
  const colWidth = (pageWidth - margin * 2 - 24) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("BILLED TO", margin, y);
  doc.text("VEHICLE", margin + colWidth + 24, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(INK);
  doc.text(bill.customerName, margin, y + 16);
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED);
  const addressLines = doc.splitTextToSize(bill.customerAddress || "Address on file", colWidth - 4);
  doc.text(addressLines, margin, y + 30);
  doc.text(`Phone: ${bill.customerPhone}`, margin, y + 30 + addressLines.length * 12);

  doc.setFontSize(10.5);
  doc.setTextColor(INK);
  doc.text(bill.vehicleRegistration, margin + colWidth + 24, y + 16);
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED);
  doc.text(`${bill.vehicleBrand} ${bill.vehicleModel}`, margin + colWidth + 24, y + 30);
  doc.text(`Job Card: ${bill.jobCardNumber}`, margin + colWidth + 24, y + 44);

  y += 90;

  // --- Line items table ---
  const totals = computeBillTotals(bill);
  const rows: (string | number)[][] = bill.parts.map((p) => [
    p.name,
    String(p.quantity),
    `Rs.${p.unitPrice.toLocaleString("en-IN")}`,
    `Rs.${(p.quantity * p.unitPrice).toLocaleString("en-IN")}`,
  ]);
  rows.push(["Labour charges", "1", `Rs.${bill.labourCost.toLocaleString("en-IN")}`, `Rs.${bill.labourCost.toLocaleString("en-IN")}`]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: rows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9.5, textColor: INK, cellPadding: { top: 7, bottom: 7, left: 4, right: 4 } },
    headStyles: { fontStyle: "bold", textColor: MUTED, fontSize: 8.5, fillColor: "#F6F7FB" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 90, halign: "right" },
      3: { cellWidth: 90, halign: "right" },
    },
    didDrawPage: (data) => {
      y = data.cursor?.y ?? y;
    },
  });

  // @ts-expect-error jspdf-autotable attaches lastAutoTable at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 24;

  // --- Totals summary (right aligned block) ---
  const summaryX = pageWidth - margin - 200;
  const summaryLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(bold ? INK : MUTED);
    doc.text(label, summaryX, y);
    doc.setTextColor(INK);
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += bold ? 20 : 16;
  };

  summaryLine("Subtotal", `Rs.${totals.subtotal.toLocaleString("en-IN")}`);
  if (bill.discountPercent > 0) {
    summaryLine(`Discount (${bill.discountPercent}%)`, `- Rs.${totals.discountAmount.toLocaleString("en-IN")}`);
  }
  summaryLine(`GST (${bill.gstPercent}%)`, `Rs.${totals.gstAmount.toLocaleString("en-IN")}`);
  doc.setDrawColor(BORDER);
  doc.line(summaryX, y - 6, pageWidth - margin, y - 6);
  y += 6;
  summaryLine("Grand Total", `Rs.${totals.grandTotal.toLocaleString("en-IN")}`, true);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED);
  doc.text(`Payment method: ${bill.paymentMethod}`, margin, y);
  doc.text(`Status: ${bill.status}`, margin, y + 14);

  // --- QR placeholder ---
  doc.setDrawColor(BORDER);
  doc.roundedRect(margin, y - 4, 56, 56, 4, 4, "S");
  doc.setFontSize(6.5);
  doc.setTextColor(MUTED);
  doc.text("Scan to pay", margin + 28, y + 24, { align: "center" });
  doc.text("(QR placeholder)", margin + 28, y + 34, { align: "center" });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(BORDER);
  doc.line(margin, pageHeight - 70, pageWidth - margin, pageHeight - 70);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  const footerLines = doc.splitTextToSize(workshop.invoiceFooter, pageWidth - margin * 2);
  doc.text(footerLines, margin, pageHeight - 54);

  return doc;
}

export async function generateInvoicePdf(bill: Bill, workshop: WorkshopProfile) {
  const doc = await buildInvoiceDoc(bill, workshop);
  doc.save(`${bill.invoiceNumber}.pdf`);
}

/** Same invoice design as generateInvoicePdf, returned as a Blob for sharing (native share file attachment, etc.) instead of triggering a download. */
export async function buildInvoicePdfBlob(bill: Bill, workshop: WorkshopProfile): Promise<Blob> {
  const doc = await buildInvoiceDoc(bill, workshop);
  return doc.output("blob");
}
