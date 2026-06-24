import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClientShell from "@/components/dashboard/DashboardClientShell";
import { CurrencyProvider } from "@/lib/currency-context";
import { ToastProvider } from "@/lib/toast-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";
import { COOKIE_SESSION, readSessionToken } from "@/lib/auth-tokens";
import type { UserSession } from "@/lib/auth-types";
import "@/styles/design-tokens.css";
import "./dashboard.css";
import "@/styles/ui-components.css";
import "@/styles/dashboard-modules.css";
import "@/styles/dashboard-shell.css";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);

  if (!session) {
    redirect("/login");
  }

  const initialUser: UserSession = {
    firstName: session.firstName,
    lastName: session.lastName,
    phone: session.phone,
    role: session.role,
  };

  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <ConfirmProvider>
            <CurrencyProvider>
              <DashboardClientShell initialUser={initialUser}>{children}</DashboardClientShell>
            </CurrencyProvider>
          </ConfirmProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
