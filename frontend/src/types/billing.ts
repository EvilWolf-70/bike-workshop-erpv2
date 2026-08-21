import type { JobCardPart } from "./jobcard";

export type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank Transfer";
export type BillStatus = "Unpaid" | "Paid";

export interface Bill {
  id: string;
  invoiceNumber: string;
  jobCardId: string;
  jobCardNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  vehicleRegistration: string;
  vehicleBrand: string;
  vehicleModel: string;
  // Snapshotted at creation time so later edits to the job card, or price
  // changes in inventory, never retroactively change an issued invoice.
  parts: JobCardPart[];
  labourCost: number;
  discountPercent: number;
  gstPercent: number;
  paymentMethod: PaymentMethod;
  status: BillStatus;
  createdAt: string; // ISO date
}

export type BillInput = Pick<Bill, "jobCardId" | "discountPercent" | "gstPercent" | "paymentMethod" | "status">;

export interface BillTotals {
  partsTotal: number;
  subtotal: number; // parts + labour, before discount/GST
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export function computeBillTotals(bill: Pick<Bill, "parts" | "labourCost" | "discountPercent" | "gstPercent">): BillTotals {
  const partsTotal = bill.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const subtotal = partsTotal + (bill.labourCost || 0);
  const discountAmount = Math.round((subtotal * (bill.discountPercent || 0)) / 100);
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = Math.round((taxableAmount * (bill.gstPercent || 0)) / 100);
  const grandTotal = taxableAmount + gstAmount;
  return { partsTotal, subtotal, discountAmount, taxableAmount, gstAmount, grandTotal };
}
