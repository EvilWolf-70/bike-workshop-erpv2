import { useState } from "react";
import { Plus, Search, Boxes, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeletonRows, ErrorBanner } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { useToast } from "../../components/ui/Toast";
import { useInventory } from "../../hooks/useInventory";
import { useDebounce } from "../../hooks/useDebounce";
import { InventoryFormDialog } from "./InventoryFormDialog";
import type { InventoryItem, InventoryItemInput } from "../../types/inventory";
import { isLowStock } from "../../types/inventory";

export function InventoryListPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 250);
  const { items, allCount, lowStockCount, status, error, reload, create, update, remove } = useInventory(debouncedSearch);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setFormOpen(true);
    setOpenMenuId(null);
  }

  async function handleSubmit(input: InventoryItemInput) {
    if (editing) {
      await update(editing.id, input);
      showToast("success", `${input.name} was updated.`);
    } else {
      await create(input);
      showToast("success", `${input.name} was added to inventory.`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      showToast("success", `${deleteTarget.name} was removed from inventory.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't delete item.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Inventory</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-ink-500)]">
            {status === "success" ? `${allCount} ${allCount === 1 ? "item" : "items"} tracked` : "Manage parts and stock levels"}
            {status === "success" && lowStockCount > 0 && (
              <Badge tone="warning" icon={<AlertTriangle className="size-3" />}>
                {lowStockCount} low on stock
              </Badge>
            )}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New item
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input
              placeholder="Search by item name or category"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search inventory"
            />
          </div>
        </div>

        {status === "error" ? (
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        ) : status === "success" && items.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching items"
              description={`Nothing matches "${debouncedSearch}".`}
            />
          ) : (
            <EmptyState
              icon={<Boxes className="size-6" />}
              title="No inventory items yet"
              description="Add parts and consumables to track stock and link them to job cards."
              action={
                <Button size="sm" onClick={openCreate} className="mt-1">
                  <Plus className="size-4" />
                  Add item
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableTh>Item</TableTh>
                <TableTh className="hidden sm:table-cell">Category</TableTh>
                <TableTh>Stock</TableTh>
                <TableTh className="hidden sm:table-cell text-right">Purchase price</TableTh>
                <TableTh className="text-right">Selling price</TableTh>
                <TableTh className="w-12" />
              </tr>
            </TableHead>
            <TableBody>
              {status === "loading" ? (
                <TableSkeletonRows rows={6} cols={6} />
              ) : (
                items.map((item) => {
                  const low = isLowStock(item);
                  return (
                    <TableRow key={item.id}>
                      <TableTd>
                        <button onClick={() => openEdit(item)} className="text-left">
                          <span className="text-[var(--color-ink-900)] hover:text-[var(--color-brand-600)]">{item.name}</span>
                        </button>
                      </TableTd>
                      <TableTd className="hidden sm:table-cell">
                        <Badge tone="neutral">{item.category}</Badge>
                      </TableTd>
                      <TableTd>
                        <div className="flex items-center gap-2">
                          <span className={low ? "font-medium text-[var(--color-danger-500)]" : "text-[var(--color-ink-700)]"}>
                            {item.quantity}
                          </span>
                          {low && (
                            <Badge tone="warning" icon={<AlertTriangle className="size-3" />}>
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableTd>
                      <TableTd className="hidden sm:table-cell text-right font-mono text-[var(--color-ink-700)]">
                        ₹{item.purchasePrice.toLocaleString("en-IN")}
                      </TableTd>
                      <TableTd className="text-right font-mono font-medium text-[var(--color-ink-900)]">
                        ₹{item.sellingPrice.toLocaleString("en-IN")}
                      </TableTd>
                      <TableTd className="relative">
                        <RowActionsMenu
                          label={`Actions for ${item.name}`}
                          open={openMenuId === item.id}
                          onToggle={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          onClose={() => setOpenMenuId(null)}
                          actions={[
                            { key: "edit", icon: <Pencil className="size-4" />, label: "Edit", onClick: () => openEdit(item) },
                            { key: "delete", icon: <Trash2 className="size-4" />, label: "Delete", danger: true, onClick: () => { setDeleteTarget(item); setOpenMenuId(null); } },
                          ]}
                        />
                      </TableTd>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <InventoryFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} item={editing} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete item?"
        description={`This removes ${deleteTarget?.name ?? "this item"} from inventory. Job cards that already reference it are unaffected.`}
        confirmLabel="Delete item"
      />
    </div>
  );
}
