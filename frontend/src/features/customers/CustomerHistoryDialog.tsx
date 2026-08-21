import { useEffect, useState } from "react";
import { Bike, Loader2 } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { Customer, CustomerHistory } from "../../types/customer";
import * as customerService from "../../services/api/customerService";

interface CustomerHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const statusTone = {
  Pending: "warning",
  "In Progress": "brand",
  Completed: "success",
  Delivered: "neutral",
} as const;

export function CustomerHistoryDialog({ open, onClose, customer }: CustomerHistoryDialogProps) {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      setLoading(true);
      setHistory(null);
      customerService
        .fetchCustomerHistory(customer.id)
        .then(setHistory)
        .finally(() => setLoading(false));
    }
  }, [open, customer]);

  if (!customer) return null;

  return (
    <Dialog open={open} onClose={onClose} title={customer.name} description={`${customer.phone} · ${customer.address || "No address on file"}`} size="lg">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-ink-500)]">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading history…</span>
        </div>
      ) : history && (history.vehicles.length > 0 || history.jobs.length > 0) ? (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-2.5 font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink-900)]">
              Vehicles ({history.vehicles.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {history.vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2"
                >
                  <Bike className="size-4 text-[var(--color-brand-500)]" />
                  <div className="text-sm">
                    <span className="font-mono font-medium text-[var(--color-ink-900)]">{v.registrationNumber}</span>
                    <span className="text-[var(--color-ink-500)]"> · {v.brand} {v.model}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink-900)]">
              Job history ({history.jobs.length})
            </h3>
            <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-control)] border border-[var(--color-border)]">
              {history.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink-900)]">{job.jobCardNumber}</p>
                    <p className="font-mono text-xs text-[var(--color-ink-500)]">{job.vehicleRegistration} · {job.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                    <span className="w-20 text-right text-sm font-medium text-[var(--color-ink-900)]">
                      ₹{job.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState
          icon={<Bike className="size-6" />}
          title="No history yet"
          description="Vehicles and job cards for this customer will show up here once they're added."
        />
      )}
    </Dialog>
  );
}
