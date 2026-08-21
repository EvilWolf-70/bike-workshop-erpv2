import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Customer, CustomerInput } from "../../types/customer";
import { DuplicateError } from "../../services/api/customerService";

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => Promise<void>;
  customer?: Customer | null; // present = edit mode
  layer?: "base" | "top";
  /** Called when the person resolves a duplicate by choosing to use the existing record instead of creating a new one. */
  onUseExisting?: (customer: Customer) => void;
}

const emptyForm: CustomerInput = { name: "", phone: "", whatsapp: "", address: "" };

export function CustomerFormDialog({ open, onClose, onSubmit, customer, layer, onUseExisting }: CustomerFormDialogProps) {
  const isEdit = !!customer;
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const initial = customer
        ? { name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp, address: customer.address }
        : emptyForm;
      setForm(initial);
      setSameAsPhone(!customer || customer.phone === customer.whatsapp);
      setErrors({});
      setSubmitError(null);
      setDuplicateMatch(null);
    }
  }, [open, customer]);

  function validate(): boolean {
    const next: Partial<Record<keyof CustomerInput, string>> = {};
    if (!form.name.trim()) next.name = "Customer name is required.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length !== 10) next.phone = "Enter a valid 10-digit phone number.";
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
      await onSubmit({ ...form, whatsapp: sameAsPhone ? form.phone : form.whatsapp });
      onClose();
    } catch (err) {
      if (err instanceof DuplicateError) {
        setDuplicateMatch(err.existing);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't save customer. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit customer" : "New customer"}
      description={isEdit ? "Update this customer's contact details." : "Add a customer before creating a job card."}
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
              Use existing customer
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="customer-form" loading={submitting}>
              {isEdit ? "Save changes" : "Add customer"}
            </Button>
          </>
        )
      }
    >
      {duplicateMatch ? (
        <div className="flex gap-3" role="alert">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-amber-50)]">
            <UserCheck className="size-5 text-[var(--color-amber-700)]" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-ink-900)]">
              A customer with this mobile number already exists.
            </p>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-3 text-sm">
              <p className="font-medium text-[var(--color-ink-900)]">{duplicateMatch.name}</p>
              <p className="font-mono text-xs text-[var(--color-ink-500)]">{duplicateMatch.phone}</p>
              {duplicateMatch.address && <p className="mt-1 text-xs text-[var(--color-ink-500)]">{duplicateMatch.address}</p>}
            </div>
            <p className="text-xs text-[var(--color-ink-500)]">
              You can use this existing customer instead, or go back and correct the mobile number.
            </p>
          </div>
        </div>
      ) : (
        <form id="customer-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Customer name"
            placeholder="e.g. Arun Kumar"
            autoFocus
            autoComplete="name"
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Mobile number"
            placeholder="10-digit mobile number"
            mono
            inputMode="numeric"
            autoComplete="tel"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink-700)]">
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(e) => setSameAsPhone(e.target.checked)}
                className="size-4 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-500)]"
              />
              WhatsApp number is the same as phone
            </label>
            {!sameAsPhone && (
              <Input
                placeholder="WhatsApp number"
                mono
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            )}
          </div>
          <Input
            label="Address"
            placeholder="Street, area, city"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
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
