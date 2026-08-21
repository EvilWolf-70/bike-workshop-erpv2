const INK = "#12141C";
const MUTED = "#656B7C";
const BORDER = "#E5E8EF";

export interface ReportColumn {
  header: string;
  align?: "left" | "right" | "center";
}

export interface ReportExportData {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: (string | number)[][];
  summaryLines?: { label: string; value: string }[];
  fileBaseName: string;
}

export async function exportReportPdf(data: ReportExportData) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(INK);
  doc.text(data.title, margin, y);

  if (data.subtitle) {
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(data.subtitle, margin, y);
  }

  y += 20;
  doc.setDrawColor(BORDER);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [data.columns.map((c) => c.header)],
    body: data.rows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, textColor: INK, cellPadding: { top: 6, bottom: 6, left: 4, right: 4 } },
    headStyles: { fontStyle: "bold", textColor: MUTED, fontSize: 8.5, fillColor: "#F6F7FB" },
    columnStyles: Object.fromEntries(
      data.columns.map((c, i) => [i, { halign: c.align ?? "left" }])
    ),
  });

  if (data.summaryLines?.length) {
    // @ts-expect-error jspdf-autotable attaches lastAutoTable at runtime
    let summaryY = (doc.lastAutoTable?.finalY ?? y) + 24;
    const summaryX = pageWidth - margin - 200;
    for (const line of data.summaryLines) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(MUTED);
      doc.text(line.label, summaryX, summaryY);
      doc.setTextColor(INK);
      doc.setFont("helvetica", "bold");
      doc.text(line.value, pageWidth - margin, summaryY, { align: "right" });
      summaryY += 16;
    }
  }

  doc.save(`${data.fileBaseName}.pdf`);
}

/**
 * SECURITY NOTE: the npm-published `xlsx` (SheetJS) package has an
 * unpatched high-severity advisory (prototype pollution / ReDoS), but both
 * issues live in the *parsing* path (XLSX.read on untrusted files). This
 * function only ever writes a workbook built from our own trusted app
 * data — it never parses external files — so that exposure doesn't apply
 * here. Re-evaluate if this utility is ever repurposed to import files.
 */
export async function exportReportExcel(data: ReportExportData) {
  const XLSX = await import("xlsx");
  const sheetData = [data.columns.map((c) => c.header), ...data.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${data.fileBaseName}.xlsx`);
}
