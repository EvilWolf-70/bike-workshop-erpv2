import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Wrench, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!username.trim()) next.username = "Username is required.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return; // guards against duplicate submissions (e.g. double Enter)

    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ username, password });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "NETWORK") {
        setFormError("Unable to sign in right now. Please try again.");
      } else {
        // Deliberately generic for INVALID_CREDENTIALS and any other
        // failure — never reveal which of username/password was wrong.
        setFormError("Invalid username or password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <div className="flex size-11 items-center justify-center rounded-[12px] bg-[var(--color-brand-500)] text-white">
            <Wrench className="size-5.5" />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink-900)]">Gear &amp; Grease</p>
            <p className="text-sm text-[var(--color-ink-400)]">Workshop ERP</p>
          </div>
        </div>

        <Card className="p-6 sm:p-7">
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Enter your workshop credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <Input
              label="Username"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              value={username}
              error={errors.username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="flex size-9 items-center justify-center rounded-md text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-700)]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />

            {formError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--color-danger-50)] px-3 py-2.5 text-sm text-[var(--color-danger-500)]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-xs text-[var(--color-ink-400)]">
          Demo credentials — username <span className="font-mono">admin</span>, password{" "}
          <span className="font-mono">workshop123</span>
        </p>
      </div>
    </div>
  );
}
