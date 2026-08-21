import { useEffect, useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SearchSelect } from "../../components/ui/SearchSelect";
import type { BillInput, PaymentMethod } from "../../types/billing";
import { computeBillTotals } from "../../types/billing";
import type { JobCard } from "../../types/jobcard";
import * as billingService from "../../services/api/billingService";

interface BillFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: BillInput) => Promise<void>;
}

const emptyForm: BillInput = {
  jobCardId: "",
  discountPercent: 0,
  gstPercent: billingService.DEFAULT_GST_PERCENT,
  paymentMethod: "Cash",
  status: "Unpaid",
};

export function BillFormDialog({ open, onClose, onSubmit }: BillFormDialogProps) {
  const [form, setForm] = useState<BillInput>(emptyForm);
  const [billableJobs, setBillableJobs] = useState<JobCard[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [errors, setErrors] = useState<{ jobCardId?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setErrors({});
      setSubmitError(null);
      setLoadingJobs(true);
      billingService
        .fetchBillableJobCards()
        .then(setBillableJobs)
        .finally(() => setLoadingJobs(false));
    }
  }, [open]);

  const selectedJob = billableJobs.find((j) => j.id === form.jobCardId) ?? null;
  const totals = selectedJob
    ? computeBillTotals({ parts: selectedJob.parts, labourCost: selectedJob.labourCost, discountPercent: form.discountPercent, gstPercent: form.gstPercent })
    : null;

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.jobCardId) next.jobCardId = "Select a job card to bill.";
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
      setSubmitError(err instanceof Error ? err.message : "Couldn't create bill. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const jobOptions = billableJobs.map((j) => ({
    id: j.id,
    label: `${j.jobCardNumber} · ${j.vehicleRegistration}`,
    sublabel: `${j.customerName} · ${j.status}`,
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New bill"
      description="Bill a completed job card and generate an invoice."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="bill-form" loading={submitting} disabled={!selectedJob}>
            Create bill
          </Button>
        </>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SearchSelect
          label="Job card"
          placeholder={loadingJobs ? "Loading job cards…" : "Search by job # or registration number"}
          options={jobOptions}
          value={form.jobCardId || null}
          onChange={(id) => setForm((f) => ({ ...f, jobCardId: id ?? "" }))}
          error={errors.jobCardId}
          emptyMessage="No unbilled job cards. Every job card already has an invoice."
        />

        {selectedJob && totals && (
          <>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] p-3.5">
              <div className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
                {selectedJob.parts.map((p) => (
                  <div key={p.id} className="flex justify-between py-1.5">
                    <span className="text-[var(--color-ink-700)]">{p.name} × {p.quantity}</span>
                    <span className="text-[var(--color-ink-900)]">₹{(p.quantity * p.unitPrice).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--color-ink-700)]">Labour</span>
                  <span className="text-[var(--color-ink-900)]">₹{selectedJob.labourCost.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Discount (%)"
                type="number"
                min={0}
                max={100}
                value={form.discountPercent || ""}
                onChange={(e) => setForm((f) => ({ ...f, discountPercent: Math.min(100, Number(e.target.value) || 0) }))}
              />
              <Input
                label="GST (%)"
                type="number"
                min={0}
                max={28}
                value={form.gstPercent}
                onChange={(e) => setForm((f) => ({ ...f, gstPercent: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Payment method"
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
              >
                {billingService.PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select
                label="Payment status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BillInput["status"] }))}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-3.5 text-sm">
              <div className="flex justify-between text-[var(--color-ink-700)]">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {form.discountPercent > 0 && (
                <div className="flex justify-between text-[var(--color-ink-700)]">
                  <span>Discount</span>
                  <span>− ₹{totals.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--color-ink-700)]">
                <span>GST</span>
                <span>₹{totals.gstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[var(--color-brand-100)] pt-1.5 text-base font-semibold text-[var(--color-brand-700)]">
                <span>Grand total</span>
                <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </>
        )}

        {submitError && (
          <p className="rounded-[var(--radius-control)] bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-500)]">
            {submitError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
