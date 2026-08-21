import { useEffect, useState } from "react";
import { Building2, FileText } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { LogoUploader } from "./LogoUploader";
import type { WorkshopProfile } from "../../types/settings";
import * as settingsService from "../../services/api/settingsService";

export function SettingsPage() {
  const [form, setForm] = useState<WorkshopProfile | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"workshopName" | "phone", string>>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    settingsService.fetchWorkshopProfile().then(setForm);
  }, []);

  function validate(f: WorkshopProfile): boolean {
    const next: typeof errors = {};
    if (!f.workshopName.trim()) next.workshopName = "Workshop name is required.";
    if (f.phone.replace(/\D/g, "").length !== 10) next.phone = "Enter a valid 10-digit phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!validate(form)) return;

    setSaving(true);
    try {
      const saved = await settingsService.updateWorkshopProfile(form);
      setForm(saved);
      showToast("success", "Workshop settings were saved.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Couldn't save settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-2/3" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          This information appears on every invoice you generate.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="size-4.5 text-[var(--color-brand-500)]" />
            <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)]">
              Workshop identity
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <LogoUploader
              value={form.logoDataUrl}
              onChange={(logoDataUrl) => setForm((f) => f && { ...f, logoDataUrl })}
              onError={(message) => showToast("error", message)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Workshop name"
                value={form.workshopName}
                error={errors.workshopName}
                onChange={(e) => setForm((f) => f && { ...f, workshopName: e.target.value })}
              />
              <Input
                label="Owner name"
                value={form.ownerName}
                onChange={(e) => setForm((f) => f && { ...f, ownerName: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="size-4.5 text-[var(--color-brand-500)]" />
            <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)]">
              Contact & tax details
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone number"
                mono
                value={form.phone}
                error={errors.phone}
                onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })}
              />
              <Input
                label="GST number"
                mono
                value={form.gstNumber}
                onChange={(e) => setForm((f) => f && { ...f, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>
            <Textarea
              label="Address"
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="size-4.5 text-[var(--color-brand-500)]" />
            <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)]">
              Invoice footer
            </h2>
          </div>
          <Textarea
            hint="Shown at the bottom of every generated invoice — warranty terms, thank-you note, etc."
            rows={3}
            value={form.invoiceFooter}
            onChange={(e) => setForm((f) => f && { ...f, invoiceFooter: e.target.value })}
          />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
