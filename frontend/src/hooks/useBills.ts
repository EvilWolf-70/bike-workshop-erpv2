import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bill, BillInput, BillStatus } from "../types/billing";
import * as billingService from "../services/api/billingService";

type Status = "loading" | "success" | "error";

export function useBills(searchTerm: string) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await billingService.fetchBills();
      setBills(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Check your connection and try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return bills;
    return bills.filter(
      (b) =>
        b.invoiceNumber.toLowerCase().includes(term) ||
        b.jobCardNumber.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        b.vehicleRegistration.toLowerCase().replace(/\s/g, "").includes(term.replace(/\s/g, ""))
    );
  }, [bills, searchTerm]);

  const create = useCallback(async (input: BillInput) => {
    const created = await billingService.createBill(input);
    setBills((prev) => [created, ...prev]);
    return created;
  }, []);

  const setPaidStatus = useCallback(async (id: string, next: BillStatus) => {
    const updated = await billingService.updateBillStatus(id, next);
    setBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await billingService.deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { bills: filtered, status, error, reload: load, create, setPaidStatus, remove };
}
