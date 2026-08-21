import type { Bill } from "../../types/billing";
import type { Customer } from "../../types/customer";
import type { InventoryItem } from "../../types/inventory";
import type { DateRange, RevenueSeries } from "../../types/revenue";
import { request } from "./apiClient";

export interface DailySalesReport {
  date: string;
  bills: Bill[];
  totalRevenue: number;
  billCount: number;
}

export interface MonthlySalesDay {
  date: string;
  revenue: number;
  billCount: number;
}

export interface MonthlySalesReport {
  month: string; // "YYYY-MM"
  days: MonthlySalesDay[];
  totalRevenue: number;
  billCount: number;
}

export interface InventorySummaryReport {
  items: InventoryItem[];
  totalStockValue: number; // valued at purchase price
  totalPotentialRevenue: number; // valued at selling price
  lowStockCount: number;
}

export interface CustomerSummaryReport {
  customers: Customer[];
  totalCustomers: number;
  totalLifetimeRevenue: number;
}

export async function fetchDailySales(dateISO: string): Promise<DailySalesReport> {
  return request<DailySalesReport>(`/reports/daily?date=${encodeURIComponent(dateISO)}`);
}

export async function fetchMonthlySales(monthISO: string): Promise<MonthlySalesReport> {
  return request<MonthlySalesReport>(`/reports/monthly?month=${encodeURIComponent(monthISO)}`);
}

export async function fetchInventorySummary(): Promise<InventorySummaryReport> {
  return request<InventorySummaryReport>("/reports/inventory-summary");
}

export async function fetchCustomerSummary(): Promise<CustomerSummaryReport> {
  return request<CustomerSummaryReport>("/reports/customer-summary");
}

export async function fetchRevenueSeries(range: DateRange): Promise<RevenueSeries> {
  return request<RevenueSeries>(
    `/reports/revenue-series?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
  );
}
