import type { Bill, BillInput } from "../../types/billing";
import type { JobCard } from "../../types/jobcard";
import { request } from "./apiClient";

export const PAYMENT_METHODS: Bill["paymentMethod"][] = ["Cash", "UPI", "Card", "Bank Transfer"];
export const DEFAULT_GST_PERCENT = 18;

export async function fetchBills(): Promise<Bill[]> {
  return request<Bill[]>("/bills");
}

export async function fetchBillableJobCards(): Promise<JobCard[]> {
  return request<JobCard[]>("/bills/billable-jobcards");
}

export async function createBill(input: BillInput): Promise<Bill> {
  return request<Bill>("/bills", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBillStatus(id: string, status: Bill["status"]): Promise<Bill> {
  return request<Bill>(`/bills/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteBill(id: string): Promise<void> {
  await request<void>(`/bills/${id}`, {
    method: "DELETE",
  });
}
