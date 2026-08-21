import { useEffect, useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import type { InventoryItem, InventoryItemInput } from "../../types/inventory";
import * as inventoryService from "../../services/api/inventoryService";

interface InventoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: InventoryItemInput) => Promise<void>;
  item?: InventoryItem | null;
}

const emptyForm: InventoryItemInput = {
  name: "",
  category: inventoryService.CATEGORIES[0],
  quantity: 0,
  purchasePrice: 0,
  sellingPrice: 0,
  lowStockLevel: 5,
};

export function InventoryFormDialog({ open, onClose, onSubmit, item }: InventoryFormDialogProps) {
  const isEdit = !!item;
  const [form, setForm] = useState<InventoryItemInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"name", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? {
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              lowStockLevel: item.lowStockLevel,
            }
          : emptyForm
      );
      setErrors({});
      setSubmitError(null);
    }
  }, [open, item]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Item name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't save item. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit item" : "New inventory item"}
      description={isEdit ? "Update stock, pricing, or the low-stock threshold." : "Add a part or consumable to track stock for."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="inventory-form" loading={submitting}>
            {isEdit ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <form id="inventory-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Item name"
          placeholder="e.g. Engine oil (1L)"
          autoFocus
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {inventoryService.CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Quantity in stock"
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))}
          />
          <Input
            label="Low stock alert level"
            type="number"
            min={0}
            hint="Flagged when stock falls to this level or below"
            value={form.lowStockLevel}
            onChange={(e) => setForm((f) => ({ ...f, lowStockLevel: Number(e.target.value) || 0 }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Purchase price"
            type="number"
            min={0}
            mono
            value={form.purchasePrice || ""}
            onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) || 0 }))}
          />
          <Input
            label="Selling price"
            type="number"
            min={0}
            mono
            value={form.sellingPrice || ""}
            onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) || 0 }))}
          />
        </div>

        {submitError && (
          <p className="rounded-[var(--radius-control)] bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-500)]">
            {submitError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
