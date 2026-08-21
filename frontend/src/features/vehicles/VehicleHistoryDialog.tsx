import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { Vehicle, VehicleHistory } from "../../types/vehicle";
import * as vehicleService from "../../services/api/vehicleService";

interface VehicleHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

const statusTone = {
  Pending: "warning",
  "In Progress": "brand",
  Completed: "success",
  Delivered: "neutral",
} as const;

export function VehicleHistoryDialog({ open, onClose, vehicle }: VehicleHistoryDialogProps) {
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setLoading(true);
      setHistory(null);
      vehicleService
        .fetchVehicleHistory(vehicle.id)
        .then(setHistory)
        .finally(() => setLoading(false));
    }
  }, [open, vehicle]);

  if (!vehicle) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={vehicle.registrationNumber}
      description={`${vehicle.brand} ${vehicle.model} · ${vehicle.ownerName} · ${vehicle.odometer.toLocaleString("en-IN")} km`}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-ink-500)]">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading service history…</span>
        </div>
      ) : history && history.jobs.length > 0 ? (
        <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-control)] border border-[var(--color-border)]">
          {history.jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-ink-900)]">{job.complaint}</p>
                <p className="font-mono text-xs text-[var(--color-ink-500)]">{job.jobCardNumber} · {job.date}</p>
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
      ) : (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="No service history yet"
          description="Job cards created for this vehicle will show up here."
        />
      )}
    </Dialog>
  );
}
