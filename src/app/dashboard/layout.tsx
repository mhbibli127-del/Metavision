import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardAuthGate from "@/components/dashboard/DashboardAuthGate";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import TasteMindProvider from "@/components/dashboard/tastemind/TasteMindProvider";
import RealtimeIndicator from "@/components/dashboard/RealtimeIndicator";
import TokenRefresh from "@/components/dashboard/TokenRefresh";
import { CurrencyProvider } from "@/lib/currency-context";
import { DashboardShellProvider } from "@/lib/dashboard-shell-context";
import { ToastProvider } from "@/lib/toast-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";
import "@/styles/design-tokens.css";
import "./dashboard.css";
import "@/styles/ui-components.css";
import "@/styles/dashboard-modules.css";
import "@/styles/dashboard-shell.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <ConfirmProvider>
          <CurrencyProvider>
            <DashboardShellProvider>
              <div className="dash-shell">
                <TokenRefresh />
                <DashboardSidebar />
                <main className="dash-main">
                  <DashboardTopBar />
                  <DashboardAuthGate>
                    <TasteMindProvider>{children}</TasteMindProvider>
                  </DashboardAuthGate>
                  <RealtimeIndicator />
                </main>
              </div>
            </DashboardShellProvider>
          </CurrencyProvider>
          </ConfirmProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
