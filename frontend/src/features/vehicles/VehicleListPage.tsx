import { useState } from "react";
import { Plus, Search, Bike, Pencil, Trash2, History, Gauge } from "lucide-react";
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
import { useVehicles } from "../../hooks/useVehicles";
import { useDebounce } from "../../hooks/useDebounce";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { VehicleHistoryDialog } from "./VehicleHistoryDialog";
import type { Vehicle, VehicleInput } from "../../types/vehicle";

export function VehicleListPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 250);
  const { vehicles, allCount, status, error, reload, create, update, remove } = useVehicles(debouncedSearch);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setFormOpen(true);
    setOpenMenuId(null);
  }

  async function handleSubmit(input: VehicleInput) {
    if (editing) {
      await update(editing.id, input);
      showToast("success", `${input.registrationNumber.toUpperCase()} was updated.`);
    } else {
      await create(input);
      showToast("success", `${input.registrationNumber.toUpperCase()} was added.`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      showToast("success", `${deleteTarget.registrationNumber} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't delete vehicle.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Vehicles</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            {status === "success" ? `${allCount} ${allCount === 1 ? "vehicle" : "vehicles"} on record` : "Manage vehicles and service history"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New vehicle
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input
              placeholder="Search by reg. number, owner, or model"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search vehicles"
            />
          </div>
        </div>

        {status === "error" ? (
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        ) : status === "success" && vehicles.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching vehicles"
              description={`Nothing matches "${debouncedSearch}". Try a registration number, owner, or model.`}
            />
          ) : (
            <EmptyState
              icon={<Bike className="size-6" />}
              title="No vehicles yet"
              description="Add a vehicle to a customer before creating a job card."
              action={
                <Button size="sm" onClick={openCreate} className="mt-1">
                  <Plus className="size-4" />
                  Add vehicle
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableTh>Vehicle</TableTh>
                <TableTh>Owner</TableTh>
                <TableTh className="hidden sm:table-cell">Odometer</TableTh>
                <TableTh className="hidden md:table-cell">Last service</TableTh>
                <TableTh>Jobs</TableTh>
                <TableTh className="w-12" />
              </tr>
            </TableHead>
            <TableBody>
              {status === "loading" ? (
                <TableSkeletonRows rows={5} cols={6} />
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableTd>
                      <button onClick={() => setHistoryTarget(v)} className="flex items-center gap-3 text-left">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                          <Bike className="size-4.5" />
                        </span>
                        <span>
                          <span className="block font-mono text-sm font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-600)]">
                            {v.registrationNumber}
                          </span>
                          <span className="block text-xs text-[var(--color-ink-500)]">
                            {v.brand} {v.model}
                          </span>
                        </span>
                      </button>
                    </TableTd>
                    <TableTd>
                      <span className="block text-[var(--color-ink-900)]">{v.ownerName}</span>
                      <span className="block font-mono text-xs text-[var(--color-ink-500)]">{v.ownerPhone}</span>
                    </TableTd>
                    <TableTd className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="size-3.5 text-[var(--color-ink-400)]" />
                        {v.odometer.toLocaleString("en-IN")} km
                      </div>
                    </TableTd>
                    <TableTd className="hidden md:table-cell">
                      {v.lastServiceDate ? (
                        <span>{new Date(v.lastServiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      ) : (
                        <span className="text-[var(--color-ink-400)]">Never</span>
                      )}
                    </TableTd>
                    <TableTd>
                      <Badge tone="neutral">{v.totalJobs}</Badge>
                    </TableTd>
                    <TableTd className="relative">
                      <RowActionsMenu
                        label={`Actions for ${v.registrationNumber}`}
                        open={openMenuId === v.id}
                        onToggle={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                        onClose={() => setOpenMenuId(null)}
                        actions={[
                          { key: "history", icon: <History className="size-4" />, label: "View history", onClick: () => { setHistoryTarget(v); setOpenMenuId(null); } },
                          { key: "edit", icon: <Pencil className="size-4" />, label: "Edit", onClick: () => openEdit(v) },
                          { key: "delete", icon: <Trash2 className="size-4" />, label: "Delete", danger: true, onClick: () => { setDeleteTarget(v); setOpenMenuId(null); } },
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

      <VehicleFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} vehicle={editing} />
      <VehicleHistoryDialog open={!!historyTarget} onClose={() => setHistoryTarget(null)} vehicle={historyTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete vehicle?"
        description={`This removes ${deleteTarget?.registrationNumber ?? "this vehicle"} from records. Job cards and bills already created will stay on record.`}
        confirmLabel="Delete vehicle"
      />
    </div>
  );
}

