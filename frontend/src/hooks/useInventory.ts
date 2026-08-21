import { useCallback, useEffect, useMemo, useState } from "react";
import type { InventoryItem, InventoryItemInput } from "../types/inventory";
import * as inventoryService from "../services/api/inventoryService";

type Status = "loading" | "success" | "error";

export function useInventory(searchTerm: string) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await inventoryService.fetchInventoryItems();
      setItems(data);
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
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const lowStockCount = useMemo(() => items.filter((i) => i.quantity <= i.lowStockLevel).length, [items]);

  const create = useCallback(async (input: InventoryItemInput) => {
    const created = await inventoryService.createInventoryItem(input);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: InventoryItemInput) => {
    const updated = await inventoryService.updateInventoryItem(id, input);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await inventoryService.deleteInventoryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items: filtered, allCount: items.length, lowStockCount, status, error, reload: load, create, update, remove };
}
