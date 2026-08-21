import { useState } from "react";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Sidebar } from "./components/layout/Sidebar";
import type { NavPage } from "./components/layout/Sidebar";
import { MobileTopBar } from "./components/layout/MobileTopBar";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CustomerListPage } from "./features/customers/CustomerListPage";
import { VehicleListPage } from "./features/vehicles/VehicleListPage";
import { JobCardListPage } from "./features/jobcards/JobCardListPage";
import { BillingListPage } from "./features/billing/BillingListPage";
import { InventoryListPage } from "./features/inventory/InventoryListPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { ReportsPage } from "./features/reports/ReportsPage";

function AppShell() {
  const [page, setPage] = useState<NavPage>("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  async function handleLogout() {
    await logout();
    showToast("success", "You've been logged out.");
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)] lg:flex-row">
      <Sidebar
        current={page}
        onNavigate={setPage}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        userDisplayName={user?.displayName}
        onLogout={handleLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar title={page} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {page === "Dashboard" && <DashboardPage onNavigate={setPage} />}
            {page === "Customers" && <CustomerListPage />}
            {page === "Vehicles" && <VehicleListPage />}
            {page === "Job Cards" && <JobCardListPage />}
            {page === "Billing" && <BillingListPage />}
            {page === "Inventory" && <InventoryListPage />}
            {page === "Settings" && <SettingsPage />}
            {page === "Reports" && <ReportsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  );
}
