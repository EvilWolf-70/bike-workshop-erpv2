import { useCallback, useEffect, useState } from "react";
import type { Bill } from "../types/billing";
import { computeBillTotals } from "../types/billing";
import type { Customer } from "../types/customer";
import type { InventoryItem } from "../types/inventory";
import * as billingService from "../services/api/billingService";
import * as jobCardService from "../services/api/jobCardService";
import * as inventoryService from "../services/api/inventoryService";
import * as customerService from "../services/api/customerService";

type Status = "loading" | "success" | "error";

export interface DashboardData {
  todaysRevenue: number;
  todaysBillCount: number;
  pendingJobCount: number;
  lowStockItems: InventoryItem[];
  recentBills: Bill[];
  recentCustomers: Customer[];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [bills, jobCards, lowStockItems, customers] = await Promise.all([
        billingService.fetchBills(),
        jobCardService.fetchJobCards(),
        inventoryService.fetchLowStockItems(),
        customerService.fetchCustomers(),
      ]);

      const today = todayISO();
      const todaysBills = bills.filter((b) => b.createdAt === today);

      setData({
        todaysRevenue: todaysBills.reduce((sum, b) => sum + computeBillTotals(b).grandTotal, 0),
        todaysBillCount: todaysBills.length,
        // "Pending" here means still in the shop — Pending + In Progress —
        // which is what a workshop owner actually wants glanced at, not the literal status string.
        pendingJobCount: jobCards.filter((j) => j.status === "Pending" || j.status === "In Progress").length,
        lowStockItems,
        recentBills: bills.slice(0, 5),
        recentCustomers: customers.slice(0, 5),
      });
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong loading the dashboard.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, reload: load };
}
