import { useState } from "react";
import { Plus, Search, Users, Pencil, Trash2, History, Phone } from "lucide-react";
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
import { useCustomers } from "../../hooks/useCustomers";
import { useDebounce } from "../../hooks/useDebounce";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { CustomerHistoryDialog } from "./CustomerHistoryDialog";
import type { Customer, CustomerInput } from "../../types/customer";

export function CustomerListPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 250);
  const { customers, allCount, status, error, reload, create, update, remove } = useCustomers(debouncedSearch);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setFormOpen(true);
    setOpenMenuId(null);
  }

  async function handleSubmit(input: CustomerInput) {
    if (editing) {
      await update(editing.id, input);
      showToast("success", `${input.name.split(" ")[0]}'s details were updated.`);
    } else {
      await create(input);
      showToast("success", `${input.name.split(" ")[0]} was added to customers.`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      showToast("success", `${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't delete customer.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Customers</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            {status === "success" ? `${allCount} ${allCount === 1 ? "customer" : "customers"} on record` : "Manage customer contacts and history"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New customer
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input
              placeholder="Search by name, phone, or address"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search customers"
            />
          </div>
        </div>

        {status === "error" ? (
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        ) : status === "success" && customers.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching customers"
              description={`Nothing matches "${debouncedSearch}". Try a different name, number, or address.`}
            />
          ) : (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No customers yet"
              description="Add your first customer to start creating job cards and bills."
              action={
                <Button size="sm" onClick={openCreate} className="mt-1">
                  <Plus className="size-4" />
                  Add customer
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableTh>Customer</TableTh>
                <TableTh className="hidden sm:table-cell">Contact</TableTh>
                <TableTh>Vehicles</TableTh>
                <TableTh className="hidden md:table-cell">Last visit</TableTh>
                <TableTh className="text-right">Total spend</TableTh>
                <TableTh className="w-12" />
              </tr>
            </TableHead>
            <TableBody>
              {status === "loading" ? (
                <TableSkeletonRows rows={5} cols={6} />
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableTd>
                      <button
                        onClick={() => setHistoryTarget(c)}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-brand-50)] font-[var(--font-display)] text-sm font-bold text-[var(--color-brand-600)]">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-medium text-[var(--color-ink-900)] hover:text-[var(--color-brand-600)]">
                            {c.name}
                          </span>
                          <span className="block font-mono text-xs text-[var(--color-ink-500)] sm:hidden">{c.phone}</span>
                        </span>
                      </button>
                    </TableTd>
                    <TableTd className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 font-mono text-[13px] text-[var(--color-ink-700)]">
                        <Phone className="size-3.5 text-[var(--color-ink-400)]" />
                        {c.phone}
                      </div>
                    </TableTd>
                    <TableTd>
                      <Badge tone="neutral">{c.vehicleCount} {c.vehicleCount === 1 ? "vehicle" : "vehicles"}</Badge>
                    </TableTd>
                    <TableTd className="hidden md:table-cell">
                      {c.lastVisit ? (
                        <span>{new Date(c.lastVisit).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      ) : (
                        <span className="text-[var(--color-ink-400)]">Never</span>
                      )}
                    </TableTd>
                    <TableTd className="text-right font-medium text-[var(--color-ink-900)]">
                      ₹{c.totalSpend.toLocaleString("en-IN")}
                    </TableTd>
                    <TableTd className="relative">
                      <RowActionsMenu
                        label={`Actions for ${c.name}`}
                        open={openMenuId === c.id}
                        onToggle={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                        onClose={() => setOpenMenuId(null)}
                        actions={[
                          { key: "history", icon: <History className="size-4" />, label: "View history", onClick: () => { setHistoryTarget(c); setOpenMenuId(null); } },
                          { key: "edit", icon: <Pencil className="size-4" />, label: "Edit", onClick: () => openEdit(c) },
                          { key: "delete", icon: <Trash2 className="size-4" />, label: "Delete", danger: true, onClick: () => { setDeleteTarget(c); setOpenMenuId(null); } },
                        ]}
                      />
                    </TableTd>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CustomerFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} customer={editing} />
      <CustomerHistoryDialog open={!!historyTarget} onClose={() => setHistoryTarget(null)} customer={historyTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete customer?"
        description={`This removes ${deleteTarget?.name ?? "this customer"} and their contact details. Job cards and bills already created will stay on record.`}
        confirmLabel="Delete customer"
      />
    </div>
  );
}

