import type { InventoryItem, InventoryItemInput } from "../../types/inventory";
import { request } from "./apiClient";

export const CATEGORIES = ["Engine", "Brakes", "Electrical", "Body", "Consumables", "Tyres", "Other"];

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  return request<InventoryItem[]>("/inventory");
}

export async function fetchLowStockItems(): Promise<InventoryItem[]> {
  return request<InventoryItem[]>("/inventory/low-stock");
}

export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  return request<InventoryItem>("/inventory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateInventoryItem(id: string, input: InventoryItemInput): Promise<InventoryItem> {
  return request<InventoryItem>(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await request<void>(`/inventory/${id}`, {
    method: "DELETE",
  });
}

export async function decrementStock(_id: string, _quantity: number): Promise<void> {
  // Handled automatically on the backend during bill creation
}
