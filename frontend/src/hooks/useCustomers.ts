import { useCallback, useEffect, useMemo, useState } from "react";
import type { Customer, CustomerInput } from "../types/customer";
import * as customerService from "../services/api/customerService";

type Status = "loading" | "success" | "error";

export function useCustomers(searchTerm: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await customerService.fetchCustomers();
      setCustomers(data);
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
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.whatsapp.includes(term) ||
        c.address.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const create = useCallback(async (input: CustomerInput) => {
    const created = await customerService.createCustomer(input);
    setCustomers((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: CustomerInput) => {
    const updated = await customerService.updateCustomer(id, input);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await customerService.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { customers: filtered, allCount: customers.length, status, error, reload: load, create, update, remove };
}
