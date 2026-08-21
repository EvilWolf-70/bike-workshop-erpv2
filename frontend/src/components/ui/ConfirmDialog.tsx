import { AlertTriangle } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
  layer?: "base" | "top";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  loading,
  tone = "danger",
  layer,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      layer={layer}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-50)]">
          <AlertTriangle className="size-5 text-[var(--color-danger-500)]" />
        </div>
        <p className="text-sm text-[var(--color-ink-700)] pt-2">{description}</p>
      </div>
    </Dialog>
  );
}
