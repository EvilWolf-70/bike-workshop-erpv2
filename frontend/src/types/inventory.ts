export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  lowStockLevel: number;
  updatedAt: string; // ISO date
}

export type InventoryItemInput = Pick<
  InventoryItem,
  "name" | "category" | "quantity" | "purchasePrice" | "sellingPrice" | "lowStockLevel"
>;

export function isLowStock(item: Pick<InventoryItem, "quantity" | "lowStockLevel">): boolean {
  return item.quantity <= item.lowStockLevel;
}
