import { useEffect, useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useToast } from "../../components/ui/Toast";
import { PartsEditor } from "./PartsEditor";
import type { InventoryPickerOption } from "./PartsEditor";
import type { JobCard, JobCardInput, JobStatus } from "../../types/jobcard";
import { jobCardTotal } from "../../types/jobcard";
import type { Customer, CustomerInput } from "../../types/customer";
import type { Vehicle, VehicleInput } from "../../types/vehicle";
import * as jobCardService from "../../services/api/jobCardService";
import * as inventoryService from "../../services/api/inventoryService";
import * as customerService from "../../services/api/customerService";
import * as vehicleService from "../../services/api/vehicleService";
import { CustomerFormDialog } from "../customers/CustomerFormDialog";
import { VehicleFormDialog } from "../vehicles/VehicleFormDialog";

interface JobCardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: JobCardInput) => Promise<void>;
  jobCard?: JobCard | null;
  presetVehicleId?: string | null;
}

const STATUS_OPTIONS: JobStatus[] = ["Pending", "In Progress", "Completed", "Delivered"];

const emptyForm: JobCardInput = {
  vehicleId: "",
  complaint: "",
  inspectionNotes: "",
  assignedMechanic: "",
  parts: [],
  labourCost: 0,
  status: "Pending",
};

export function JobCardFormDialog({ open, onClose, onSubmit, jobCard, presetVehicleId }: JobCardFormDialogProps) {
  const isEdit = !!jobCard;
  const { showToast } = useToast();

  const [form, setForm] = useState<JobCardInput>(emptyForm);
  const [customerId, setCustomerId] = useState("");
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPickerOption[]>([]);
  const [errors, setErrors] = useState<Partial<Record<"customerId" | "vehicleId" | "complaint", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  const [quickAddVehicleOpen, setQuickAddVehicleOpen] = useState(false);

  // Loads the vehicles owned by `ownerId` into vehicleOptions and, unless
  // told otherwise, clears the current vehicle selection — used any time
  // the selected customer changes, whether by hand, quick-create, or
  // resolving a duplicate.
  async function loadVehiclesForCustomer(ownerId: string, vehicleIdToSelect?: string) {
    if (!ownerId) {
      setVehicleOptions([]);
      setForm((f) => ({ ...f, vehicleId: "" }));
      return;
    }
    const scoped = await vehicleService.fetchVehiclesByOwner(ownerId);
    setVehicleOptions(scoped);
    setForm((f) => ({ ...f, vehicleId: vehicleIdToSelect ?? "" }));
  }

  useEffect(() => {
    if (!open) return;

    // Reset FORM FIELDS synchronously, in the same tick the dialog opens.
    // The dialog is interactive immediately — if this waited on the
    // customers/inventory fetch below before resetting, anything typed in
    // that window would get silently wiped out once the fetch resolved.
    if (jobCard) {
      setCustomerId(jobCard.customerId);
      setForm({
        vehicleId: jobCard.vehicleId,
        complaint: jobCard.complaint,
        inspectionNotes: jobCard.inspectionNotes,
        assignedMechanic: jobCard.assignedMechanic,
        parts: jobCard.parts,
        labourCost: jobCard.labourCost,
        status: jobCard.status,
      });
    } else if (presetVehicleId) {
      setForm({ ...emptyForm, vehicleId: presetVehicleId });
    } else {
      setCustomerId("");
      setForm(emptyForm);
    }
    setErrors({});
    setSubmitError(null);

    // Supporting option lists load asynchronously and only ever populate
    // *Options state — never `form` — so a slow response can't lose
    // anything the person has already typed.
    let cancelled = false;
    async function loadOptions() {
      const [customers, inventory] = await Promise.all([customerService.fetchCustomers(), inventoryService.fetchInventoryItems()]);
      if (cancelled) return;
      setCustomerOptions(customers);
      setInventoryOptions(
        inventory.map((i) => ({ id: i.id, name: i.name, sellingPrice: i.sellingPrice, quantity: i.quantity, category: i.category }))
      );

      if (jobCard) {
        const scoped = await vehicleService.fetchVehiclesByOwner(jobCard.customerId);
        if (!cancelled) setVehicleOptions(scoped);
      } else if (presetVehicleId) {
        const vehicle = (await vehicleService.fetchVehicles()).find((v) => v.id === presetVehicleId);
        if (cancelled) return;
        if (vehicle) {
          setCustomerId(vehicle.ownerId);
          setVehicleOptions(await vehicleService.fetchVehiclesByOwner(vehicle.ownerId));
        }
      } else {
        setVehicleOptions([]);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [open, jobCard, presetVehicleId]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!customerId) next.customerId = "Select a customer.";
    if (!form.vehicleId) next.vehicleId = "Select a vehicle.";
    if (!form.complaint.trim()) next.complaint = "Describe the complaint.";
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
      setSubmitError(err instanceof Error ? err.message : "Couldn't save job card. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Quick Add Customer -------------------------------------------------

  async function handleQuickCreateCustomer(input: CustomerInput) {
    const created = await customerService.createCustomer(input);
    setCustomerOptions((prev) => [created, ...prev]);
    setCustomerId(created.id);
    setVehicleOptions([]); // a brand-new customer has no vehicles yet — no need to round-trip for that
    setForm((f) => ({ ...f, vehicleId: "" }));
    showToast("success", `${created.name} was added to customers.`);
  }

  async function handleUseExistingCustomer(existing: Customer) {
    setCustomerOptions((prev) => (prev.some((c) => c.id === existing.id) ? prev : [existing, ...prev]));
    setCustomerId(existing.id);
    await loadVehiclesForCustomer(existing.id);
    showToast("success", `Using existing customer ${existing.name}.`);
  }

  // --- Quick Add Vehicle ---------------------------------------------------

  async function handleQuickCreateVehicle(input: VehicleInput) {
    const created = await vehicleService.createVehicle(input);
    setVehicleOptions((prev) => [created, ...prev]);
    setForm((f) => ({ ...f, vehicleId: created.id }));
    showToast("success", `${created.registrationNumber} was added.`);
  }

  async function handleUseExistingVehicle(existing: Vehicle) {
    // The matched vehicle might belong to a different customer than the one
    // currently selected — switch to its real owner so the form stays consistent.
    if (existing.ownerId !== customerId) {
      if (!customerOptions.some((c) => c.id === existing.ownerId)) {
        // Rare: the owner isn't in our cached list (e.g. deleted after the
        // vehicle was created). Refetch rather than fabricate a partial record.
        setCustomerOptions(await customerService.fetchCustomers());
      }
      setCustomerId(existing.ownerId);
    }
    await loadVehiclesForCustomer(existing.ownerId, existing.id);
    showToast("success", `Using existing vehicle ${existing.registrationNumber}.`);
  }

  const customerSelectOptions = customerOptions.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone }));
  const vehicleSelectOptions = vehicleOptions.map((v) => ({
    id: v.id,
    label: v.registrationNumber,
    sublabel: `${v.brand} ${v.model}`,
  }));
  const selectedCustomer = customerOptions.find((c) => c.id === customerId) ?? null;

  const total = jobCardTotal(form);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={isEdit ? `Edit ${jobCard?.jobCardNumber}` : "New job card"}
        description={isEdit ? "Update inspection details, parts, or status." : "Start a job card once the vehicle has been inspected."}
        size="lg"
        footer={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--color-ink-500)] sm:order-1">
              Estimated total: <span className="font-semibold text-[var(--color-ink-900)]">₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" form="jobcard-form" loading={submitting}>
                {isEdit ? "Save changes" : "Create job card"}
              </Button>
            </div>
          </div>
        }
      >
        <form id="jobcard-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SearchSelect
            label="Customer"
            placeholder="Search by name or phone"
            options={customerSelectOptions}
            value={customerId || null}
            onChange={(id) => {
              if (id) {
                setCustomerId(id);
                loadVehiclesForCustomer(id);
              } else {
                setCustomerId("");
                setVehicleOptions([]);
                setForm((f) => ({ ...f, vehicleId: "" }));
              }
            }}
            error={errors.customerId}
            emptyMessage="No customers found."
            onCreateNew={() => setQuickAddCustomerOpen(true)}
            createNewLabel="Add new customer"
          />

          <SearchSelect
            label="Vehicle"
            placeholder={customerId ? "Search by registration number" : "Select a customer first"}
            options={vehicleSelectOptions}
            value={form.vehicleId || null}
            onChange={(id) => setForm((f) => ({ ...f, vehicleId: id ?? "" }))}
            error={errors.vehicleId}
            emptyMessage="This customer has no vehicles yet."
            disabled={!customerId}
            disabledMessage="Select a customer first"
            onCreateNew={customerId ? () => setQuickAddVehicleOpen(true) : undefined}
            createNewLabel="Add new vehicle"
          />

          <Textarea
            label="Complaint"
            placeholder="What the customer reported"
            value={form.complaint}
            error={errors.complaint}
            onChange={(e) => setForm((f) => ({ ...f, complaint: e.target.value }))}
          />

          <Textarea
            label="Inspection notes"
            placeholder="What the mechanic found on inspection"
            value={form.inspectionNotes}
            onChange={(e) => setForm((f) => ({ ...f, inspectionNotes: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Assigned mechanic"
              value={form.assignedMechanic}
              onChange={(e) => setForm((f) => ({ ...f, assignedMechanic: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {jobCardService.MECHANICS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobStatus }))}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <PartsEditor parts={form.parts} onChange={(parts) => setForm((f) => ({ ...f, parts }))} inventoryOptions={inventoryOptions} />

          <Input
            label="Labour cost"
            type="number"
            min={0}
            mono
            placeholder="0"
            value={form.labourCost || ""}
            onChange={(e) => setForm((f) => ({ ...f, labourCost: Number(e.target.value) || 0 }))}
          />

          {submitError && (
            <p className="rounded-[var(--radius-control)] bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-500)]" role="alert">
              {submitError}
            </p>
          )}
        </form>
      </Dialog>

      {/* Quick-add dialogs stack above the Job Card dialog and never reset its state — see the dialog-stack handling in Dialog.tsx for why a single Escape press only closes the topmost one. */}
      <CustomerFormDialog
        open={quickAddCustomerOpen}
        onClose={() => setQuickAddCustomerOpen(false)}
        onSubmit={handleQuickCreateCustomer}
        onUseExisting={handleUseExistingCustomer}
        layer="top"
      />
      <VehicleFormDialog
        open={quickAddVehicleOpen}
        onClose={() => setQuickAddVehicleOpen(false)}
        onSubmit={handleQuickCreateVehicle}
        onUseExisting={handleUseExistingVehicle}
        presetOwnerId={customerId}
        lockOwnerName={selectedCustomer?.name}
        quickAdd
        layer="top"
      />
    </>
  );
}
