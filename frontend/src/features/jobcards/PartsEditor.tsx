import { useState } from "react";
import { Plus, Trash2, Package, AlertTriangle } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { SearchSelect } from "../../components/ui/SearchSelect";
import type { JobCardPart } from "../../types/jobcard";

export interface InventoryPickerOption {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  category: string;
}

interface PartsEditorProps {
  parts: JobCardPart[];
  onChange: (parts: JobCardPart[]) => void;
  inventoryOptions: InventoryPickerOption[];
}

let localIdCounter = 0;
const makeLocalId = () => `new_${Date.now()}_${localIdCounter++}`;

export function PartsEditor({ parts, onChange, inventoryOptions }: PartsEditorProps) {
  const [pickerValue, setPickerValue] = useState<string | null>(null);

  function addCustomRow() {
    onChange([...parts, { id: makeLocalId(), name: "", quantity: 1, unitPrice: 0 }]);
  }

  function addFromInventory(inventoryItemId: string | null) {
    if (!inventoryItemId) return;
    const item = inventoryOptions.find((i) => i.id === inventoryItemId);
    if (!item) return;

    const existing = parts.find((p) => p.inventoryItemId === inventoryItemId);
    if (existing) {
      updateRow(existing.id, { quantity: existing.quantity + 1 });
    } else {
      onChange([
        ...parts,
        { id: makeLocalId(), name: item.name, quantity: 1, unitPrice: item.sellingPrice, inventoryItemId: item.id },
      ]);
    }
    setPickerValue(null);
  }

  function updateRow(id: string, patch: Partial<JobCardPart>) {
    onChange(parts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeRow(id: string) {
    onChange(parts.filter((p) => p.id !== id));
  }

  const partsTotal = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const pickerOptions = inventoryOptions.map((i) => ({
    id: i.id,
    label: i.name,
    sublabel: `${i.category} · ₹${i.sellingPrice.toLocaleString("en-IN")} · ${i.quantity} in stock`,
  }));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1">
          <SearchSelect
            label="Required parts"
            placeholder="Search inventory to add a part"
            options={pickerOptions}
            value={pickerValue}
            onChange={addFromInventory}
            emptyMessage="No inventory items match. Add it to Inventory first, or add a custom part below."
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addCustomRow} className="mb-0.5">
          <Plus className="size-4" />
          Custom part
        </Button>
      </div>

      {parts.length === 0 ? (
        <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-border-strong)] px-3.5 py-4 text-center text-sm text-[var(--color-ink-400)]">
          No parts added yet. This job card can still be created — add parts once inspection is done.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {parts.map((part) => {
            const stockItem = part.inventoryItemId ? inventoryOptions.find((i) => i.id === part.inventoryItemId) : null;
            const exceedsStock = !!stockItem && part.quantity > stockItem.quantity;
            return (
              <div key={part.id} className="flex flex-col gap-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    {part.inventoryItemId ? (
                      <div className="flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-sm text-[var(--color-ink-900)]">
                        <Package className="size-3.5 shrink-0 text-[var(--color-brand-500)]" />
                        <span className="truncate">{part.name}</span>
                      </div>
                    ) : (
                      <Input
                        placeholder="Custom part name"
                        value={part.name}
                        onChange={(e) => updateRow(part.id, { name: e.target.value })}
                        aria-label="Part name"
                      />
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => updateRow(part.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        aria-label="Quantity"
                      />
                    </div>
                    <div className="w-28 flex-1 sm:flex-none">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Price"
                        mono
                        value={part.unitPrice || ""}
                        onChange={(e) => updateRow(part.id, { unitPrice: Number(e.target.value) || 0 })}
                        aria-label="Unit price"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(part.id)}
                      aria-label={`Remove ${part.name || "part"}`}
                      className="mt-2.5 shrink-0 rounded-md p-1.5 text-[var(--color-ink-400)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {exceedsStock && (
                  <p className="flex items-center gap-1.5 pl-0.5 text-xs font-medium text-[var(--color-amber-700)]">
                    <AlertTriangle className="size-3.5" />
                    Only {stockItem!.quantity} in stock — this job card will oversell this item.
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex justify-end pt-1 text-sm">
            <span className="text-[var(--color-ink-500)]">Parts subtotal:&nbsp;</span>
            <span className="font-medium text-[var(--color-ink-900)]">₹{partsTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
