import { useEffect, useState } from "react";
import { MessageCircle, Mail, Link2, Share2, Download, Check } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { useToast } from "../../components/ui/Toast";
import type { Bill } from "../../types/billing";
import type { WorkshopProfile } from "../../types/settings";
import * as settingsService from "../../services/api/settingsService";
import * as shareService from "../../services/invoiceShareService";

interface InvoiceShareMenuProps {
  open: boolean;
  onClose: () => void;
  bill: Bill;
  layer?: "base" | "top";
}

type ActionKey = "whatsapp" | "email" | "copy" | "native" | "download";

export function InvoiceShareMenu({ open, onClose, bill, layer }: InvoiceShareMenuProps) {
  const { showToast } = useToast();
  const [workshop, setWorkshop] = useState<WorkshopProfile | null>(null);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      settingsService.fetchWorkshopProfile().then(setWorkshop);
      setCopied(false);
    }
  }, [open]);

  async function run(key: ActionKey, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch {
      showToast("error", "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleWhatsApp() {
    if (!workshop) return;
    await run("whatsapp", async () => {
      const outcome = await shareService.shareViaWhatsApp(bill, workshop);
      if (outcome === "unsupported") {
        showToast("error", "This customer has no phone number on file to message.");
      }
    });
  }

  async function handleEmail() {
    if (!workshop) return;
    await run("email", async () => {
      shareService.shareViaEmail(bill, workshop);
    });
  }

  async function handleCopyLink() {
    await run("copy", async () => {
      await shareService.copyInvoiceLink(bill);
      setCopied(true);
      showToast("success", "Invoice link copied.");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleNativeShare() {
    if (!workshop) return;
    await run("native", async () => {
      const outcome = await shareService.shareNative(bill, workshop);
      if (outcome === "unsupported") {
        showToast("error", "Sharing isn't supported on this browser.");
      }
    });
  }

  async function handleDownload() {
    if (!workshop) return;
    await run("download", async () => {
      await shareService.downloadInvoicePdf(bill, workshop);
      showToast("success", "Invoice PDF downloaded.");
    });
  }

  const nativeSupported = shareService.isNativeShareSupported();

  return (
    <Dialog open={open} onClose={onClose} title="Share invoice" description={`${bill.invoiceNumber} · ${bill.customerName}`} size="sm" layer={layer}>
      <div className="flex flex-col gap-1.5">
        <ShareOption
          icon={<MessageCircle className="size-4.5" />}
          label="Share via WhatsApp"
          hint="Opens WhatsApp with a pre-filled message"
          onClick={handleWhatsApp}
          loading={busy === "whatsapp"}
          disabled={!workshop || busy !== null}
        />
        <ShareOption
          icon={<Mail className="size-4.5" />}
          label="Share via Email"
          hint="Opens your email app with a draft"
          onClick={handleEmail}
          loading={busy === "email"}
          disabled={!workshop || busy !== null}
        />
        <ShareOption
          icon={copied ? <Check className="size-4.5 text-[var(--color-success-500)]" /> : <Link2 className="size-4.5" />}
          label={copied ? "Link copied" : "Copy Link"}
          hint="Copies a shareable invoice link"
          onClick={handleCopyLink}
          loading={busy === "copy"}
          disabled={busy !== null}
        />
        {nativeSupported && (
          <ShareOption
            icon={<Share2 className="size-4.5" />}
            label="More share options"
            hint="Use your device's share menu"
            onClick={handleNativeShare}
            loading={busy === "native"}
            disabled={!workshop || busy !== null}
          />
        )}
        <ShareOption
          icon={<Download className="size-4.5" />}
          label="Download PDF"
          hint="Save the invoice to this device"
          onClick={handleDownload}
          loading={busy === "download"}
          disabled={!workshop || busy !== null}
        />
      </div>
    </Dialog>
  );
}

function ShareOption({
  icon,
  label,
  hint,
  onClick,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-3 text-left transition-colors hover:bg-[var(--color-canvas)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-[var(--color-ink-900)]">{label}</span>
        <span className="block text-xs text-[var(--color-ink-500)]">{hint}</span>
      </span>
      {loading && (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-brand-500)]" />
      )}
    </button>
  );
}
