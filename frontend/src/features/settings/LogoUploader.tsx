import { useRef } from "react";
import { Upload, X, ImageOff } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface LogoUploaderProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  onError: (message: string) => void;
}

const MAX_BYTES = 1024 * 1024; // 1MB — keeps invoice PDFs and mock storage lightweight

export function LogoUploader({ value, onChange, onError }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Logo must be an image file (PNG or JPEG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("Logo must be under 1MB. Try a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => onError("Couldn't read that image. Try a different file.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)]">
        {value ? (
          <img src={value} alt="Workshop logo" className="size-full object-cover" />
        ) : (
          <ImageOff className="size-5 text-[var(--color-ink-400)]" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" />
            {value ? "Replace logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              <X className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-[var(--color-ink-400)]">PNG or JPEG, under 1MB. Shown on printed invoices.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
