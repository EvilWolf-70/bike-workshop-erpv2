import { useState } from "react";
import { Plus, Search, ClipboardList, Pencil, Trash2, Wrench } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Tabs } from "../../components/ui/Tabs";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeletonRows, ErrorBanner } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { useToast } from "../../components/ui/Toast";
import { useJobCards } from "../../hooks/useJobCards";
import type { JobStatusFilter } from "../../hooks/useJobCards";
import { useDebounce } from "../../hooks/useDebounce";
import { JobCardFormDialog } from "./JobCardFormDialog";
import type { JobCard, JobCardInput } from "../../types/jobcard";
import { jobCardTotal } from "../../types/jobcard";

const statusTone = {
  Pending: "warning",
  "In Progress": "brand",
  Completed: "success",
  Delivered: "neutral",
} as const;

export function JobCardListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("All");
  const debouncedSearch = useDebounce(searchInput, 250);
  const { jobCards, counts, status, error, reload, create, update, remove } = useJobCards(debouncedSearch, statusFilter);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(job: JobCard) {
    setEditing(job);
    setFormOpen(true);
    setOpenMenuId(null);
  }

  async function handleSubmit(input: JobCardInput) {
    if (editing) {
      await update(editing.id, input);
      showToast("success", `${editing.jobCardNumber} was updated.`);
    } else {
      const created = await create(input);
      showToast("success", `${created.jobCardNumber} was created.`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      showToast("success", `${deleteTarget.jobCardNumber} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't delete job card.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Job Cards</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Track inspections, parts, and repair status.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New job card
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col gap-3.5 border-b border-[var(--color-border)] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input
              placeholder="Search by job #, reg. number, or customer"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search job cards"
            />
          </div>
          <Tabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "All", label: "All", count: counts.All },
              { value: "Pending", label: "Pending", count: counts.Pending },
              { value: "In Progress", label: "In Progress", count: counts["In Progress"] },
              { value: "Completed", label: "Completed", count: counts.Completed },
              { value: "Delivered", label: "Delivered", count: counts.Delivered },
            ]}
          />
        </div>

        {status === "error" ? (
          <ErrorBanner message={error ?? "Something went wrong."} onRetry={reload} />
        ) : status === "success" && jobCards.length === 0 ? (
          debouncedSearch || statusFilter !== "All" ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching job cards"
              description="Try a different search term or switch status filters."
            />
          ) : (
            <EmptyState
              icon={<ClipboardList className="size-6" />}
              title="No job cards yet"
              description="Create a job card once a customer's vehicle has been inspected."
              action={
                <Button size="sm" onClick={openCreate} className="mt-1">
                  <Plus className="size-4" />
                  New job card
                </Button>
              }
            />
          )
        ) : (
          <Table maxHeight="65vh">
            <TableHead sticky>
              <tr>
                <TableTh>Job card</TableTh>
                <TableTh>Vehicle & owner</TableTh>
                <TableTh className="hidden sm:table-cell">Mechanic</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Total</TableTh>
                <TableTh className="w-12" />
              </tr>
            </TableHead>
            <TableBody>
              {status === "loading" ? (
                <TableSkeletonRows rows={5} cols={6} />
              ) : (
                jobCards.map((j) => (
                  <TableRow key={j.id}>
                    <TableTd>
                      <button onClick={() => openEdit(j)} className="text-left">
                        <span className="block font-mono text-sm font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-600)]">
                          {j.jobCardNumber}
                        </span>
                        <span className="block max-w-[220px] truncate text-xs text-[var(--color-ink-500)]">{j.complaint}</span>
                      </button>
                    </TableTd>
                    <TableTd>
                      <span className="block font-mono text-sm text-[var(--color-ink-900)]">{j.vehicleRegistration}</span>
                      <span className="block text-xs text-[var(--color-ink-500)]">{j.customerName}</span>
                    </TableTd>
                    <TableTd className="hidden sm:table-cell">
                      {j.assignedMechanic ? (
                        <div className="flex items-center gap-1.5 text-[var(--color-ink-700)]">
                          <Wrench className="size-3.5 text-[var(--color-ink-400)]" />
                          {j.assignedMechanic}
                        </div>
                      ) : (
                        <span className="text-[var(--color-ink-400)]">Unassigned</span>
                      )}
                    </TableTd>
                    <TableTd>
                      <Badge tone={statusTone[j.status]}>{j.status}</Badge>
                    </TableTd>
                    <TableTd className="text-right font-medium text-[var(--color-ink-900)]">
                      ₹{jobCardTotal(j).toLocaleString("en-IN")}
                    </TableTd>
                    <TableTd className="relative">
                      <RowActionsMenu
                        label={`Actions for ${j.jobCardNumber}`}
                        open={openMenuId === j.id}
                        onToggle={() => setOpenMenuId(openMenuId === j.id ? null : j.id)}
                        onClose={() => setOpenMenuId(null)}
                        actions={[
                          { key: "edit", icon: <Pencil className="size-4" />, label: "Edit", onClick: () => openEdit(j) },
                          { key: "delete", icon: <Trash2 className="size-4" />, label: "Delete", danger: true, onClick: () => { setDeleteTarget(j); setOpenMenuId(null); } },
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

      <JobCardFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} jobCard={editing} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete job card?"
        description={`This permanently removes ${deleteTarget?.jobCardNumber ?? "this job card"} and its parts/labour entries. This can't be undone.`}
        confirmLabel="Delete job card"
      />
    </div>
  );
}
