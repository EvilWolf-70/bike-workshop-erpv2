import { useEffect, useState } from "react";
import { CarFront } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SearchSelect } from "../../components/ui/SearchSelect";
import type { Vehicle, VehicleInput } from "../../types/vehicle";
import * as vehicleService from "../../services/api/vehicleService";
import { DuplicateError } from "../../services/api/vehicleService";

interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  vehicle?: Vehicle | null;
  presetOwnerId?: string | null; // pre-select owner when adding a vehicle from a customer's page
  /** Lock the owner field to presetOwnerId and show this name statically, instead of a searchable picker — used from the Job Card quick-add flow where the customer is already chosen. */
  lockOwnerName?: string;
  /** Trims the form to the minimum quick-create field set (Registration, Brand, Model, Year, Odometer) and hides Engine/Chassis. */
  quickAdd?: boolean;
  layer?: "base" | "top";
  onUseExisting?: (vehicle: Vehicle) => void;
}

const emptyForm: VehicleInput = {
  registrationNumber: "",
  brand: "",
  model: "",
  year: undefined,
  ownerId: "",
  engineNumber: "",
  chassisNumber: "",
  odometer: 0,
};

export function VehicleFormDialog({
  open,
  onClose,
  onSubmit,
  vehicle,
  presetOwnerId,
  lockOwnerName,
  quickAdd,
  layer,
  onUseExisting,
}: VehicleFormDialogProps) {
  const isEdit = !!vehicle;
  const [form, setForm] = useState<VehicleInput>(emptyForm);
  const [owners, setOwners] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (!lockOwnerName) vehicleService.fetchOwnerOptions().then(setOwners);
      const initial = vehicle
        ? {
            registrationNumber: vehicle.registrationNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            ownerId: vehicle.ownerId,
            engineNumber: vehicle.engineNumber,
            chassisNumber: vehicle.chassisNumber,
            odometer: vehicle.odometer,
          }
        : { ...emptyForm, ownerId: presetOwnerId ?? "" };
      setForm(initial);
      setErrors({});
      setSubmitError(null);
      setDuplicateMatch(null);
    }
  }, [open, vehicle, presetOwnerId, lockOwnerName]);

  function validate(): boolean {
    const next: Partial<Record<keyof VehicleInput, string>> = {};
    if (!form.registrationNumber.trim()) next.registrationNumber = "Registration number is required.";
    if (!form.brand.trim()) next.brand = "Brand is required.";
    if (!form.model.trim()) next.model = "Model is required.";
    if (!form.ownerId) next.ownerId = "Select an owner.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setDuplicateMatch(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      if (err instanceof DuplicateError) {
        setDuplicateMatch(err.existing);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't save vehicle. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const ownerOptions = owners.map((o) => ({ id: o.id, label: o.name, sublabel: o.phone }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit vehicle" : "New vehicle"}
      description={isEdit ? "Update this vehicle's details." : "Add a vehicle before creating a job card."}
      layer={layer}
      footer={
        duplicateMatch ? (
          <>
            <Button variant="secondary" onClick={() => setDuplicateMatch(null)}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                onUseExisting?.(duplicateMatch);
                onClose();
              }}
            >
              Use existing vehicle
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="vehicle-form" loading={submitting}>
              {isEdit ? "Save changes" : "Add vehicle"}
            </Button>
          </>
        )
      }
    >
      {duplicateMatch ? (
        <div className="flex gap-3" role="alert">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-amber-50)]">
            <CarFront className="size-5 text-[var(--color-amber-700)]" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-ink-900)]">
              A vehicle with this registration number already exists.
            </p>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-3 text-sm">
              <p className="font-mono font-medium text-[var(--color-ink-900)]">{duplicateMatch.registrationNumber}</p>
              <p className="text-xs text-[var(--color-ink-500)]">
                {duplicateMatch.brand} {duplicateMatch.model} · {duplicateMatch.ownerName}
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-500)]">
              You can use this existing vehicle instead, or go back and correct the registration number.
            </p>
          </div>
        </div>
      ) : (
        <form id="vehicle-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {lockOwnerName ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-ink-700)]">Owner</span>
              <div className="flex h-11 items-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-sm text-[var(--color-ink-700)]">
                {lockOwnerName}
              </div>
            </div>
          ) : (
            <SearchSelect
              label="Owner"
              placeholder="Search customer by name or phone"
              options={ownerOptions}
              value={form.ownerId || null}
              onChange={(id) => setForm((f) => ({ ...f, ownerId: id ?? "" }))}
              error={errors.ownerId}
              emptyMessage="No customers found. Add a customer first."
            />
          )}
          <Input
            label="Registration number"
            placeholder="e.g. TN 74 AB 4521"
            mono
            autoFocus
            value={form.registrationNumber}
            error={errors.registrationNumber}
            onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value.toUpperCase() }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Brand"
              placeholder="e.g. Honda"
              value={form.brand}
              error={errors.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
            <Input
              label="Model"
              placeholder="e.g. Activa 6G"
              value={form.model}
              error={errors.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          {quickAdd ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Year"
                type="number"
                placeholder="e.g. 2022"
                value={form.year || ""}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) || undefined }))}
              />
              <Input
                label="Odometer (km)"
                type="number"
                min={0}
                placeholder="0"
                value={form.odometer || ""}
                onChange={(e) => setForm((f) => ({ ...f, odometer: Number(e.target.value) }))}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Engine number"
                  mono
                  placeholder="Optional"
                  value={form.engineNumber}
                  onChange={(e) => setForm((f) => ({ ...f, engineNumber: e.target.value }))}
                />
                <Input
                  label="Chassis number"
                  mono
                  placeholder="Optional"
                  value={form.chassisNumber}
                  onChange={(e) => setForm((f) => ({ ...f, chassisNumber: e.target.value }))}
                />
              </div>
              <Input
                label="Odometer (km)"
                type="number"
                min={0}
                placeholder="0"
                value={form.odometer || ""}
                onChange={(e) => setForm((f) => ({ ...f, odometer: Number(e.target.value) }))}
              />
            </>
          )}
          {submitError && (
            <p className="rounded-[var(--radius-control)] bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-500)]" role="alert">
              {submitError}
            </p>
          )}
        </form>
      )}
    </Dialog>
  );
}
