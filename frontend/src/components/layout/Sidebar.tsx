import { LayoutDashboard, Users, Bike, ClipboardList, Receipt, Boxes, BarChart3, Settings, Wrench, X, LogOut } from "lucide-react";
import { cn } from "../../utils/cn";

export type NavPage = "Dashboard" | "Customers" | "Vehicles" | "Job Cards" | "Billing" | "Inventory" | "Reports" | "Settings";

const navItems: { label: NavPage; icon: typeof LayoutDashboard; disabled?: boolean }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Customers", icon: Users },
  { label: "Vehicles", icon: Bike },
  { label: "Job Cards", icon: ClipboardList },
  { label: "Billing", icon: Receipt },
  { label: "Inventory", icon: Boxes },
  { label: "Reports", icon: BarChart3 },
];

interface SidebarProps {
  current: NavPage;
  onNavigate: (page: NavPage) => void;
  /** Whether the mobile off-canvas drawer is open. Ignored at the lg breakpoint and up, where the sidebar is always visible. */
  mobileOpen: boolean;
  onMobileClose: () => void;
  userDisplayName?: string;
  onLogout?: () => void;
}

export function Sidebar({ current, onNavigate, mobileOpen, onMobileClose, userDisplayName, onLogout }: SidebarProps) {
  function handleNavigate(page: NavPage) {
    onNavigate(page);
    onMobileClose();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-ink-900)]/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "flex h-screen w-72 shrink-0 flex-col border-r border-[var(--color-border)] bg-white",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
          "lg:static lg:z-auto lg:w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-[var(--color-brand-500)] text-white">
              <Wrench className="size-4.5" />
            </div>
            <div>
              <p className="font-[var(--font-display)] text-[15px] font-bold leading-tight text-[var(--color-ink-900)]">
                Gear&nbsp;&amp;&nbsp;Grease
              </p>
              <p className="text-xs text-[var(--color-ink-400)]">Workshop ERP</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="rounded-full p-1.5 text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map(({ label, icon: Icon, disabled }) => (
            <button
              key={label}
              disabled={disabled}
              onClick={() => handleNavigate(label)}
              title={disabled ? `${label} — coming after MVP testing` : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors",
                current === label
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                  : disabled
                  ? "text-[var(--color-ink-400)]/60 cursor-not-allowed"
                  : "text-[var(--color-ink-500)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-900)]"
              )}
            >
              <Icon className="size-4.5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] px-3 py-3">
          <button
            onClick={() => handleNavigate("Settings")}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors",
              current === "Settings"
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                : "text-[var(--color-ink-500)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-900)]"
            )}
          >
            <Settings className="size-4.5" />
            Settings
          </button>
        </div>

        {userDisplayName && onLogout && (
          <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">{userDisplayName}</p>
            </div>
            <button
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className="shrink-0 rounded-md p-1.5 text-[var(--color-ink-400)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-danger-500)]"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
