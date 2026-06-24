"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardAuthGate from "@/components/dashboard/DashboardAuthGate";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import RealtimeIndicator from "@/components/dashboard/RealtimeIndicator";
import TokenRefresh from "@/components/dashboard/TokenRefresh";
import { DashboardSessionProvider } from "@/lib/dashboard-session-context";
import { DashboardShellProvider } from "@/lib/dashboard-shell-context";
import type { UserSession } from "@/lib/auth-types";

const RealtimeProvider = dynamic(
  () => import("@/lib/realtime-context").then((m) => ({ default: m.RealtimeProvider })),
  { ssr: false },
);

const TasteMindProvider = dynamic(
  () => import("@/components/dashboard/tastemind/TasteMindProvider"),
  { ssr: false },
);

export default function DashboardClientShell({
  initialUser,
  children,
}: {
  initialUser: UserSession;
  children: ReactNode;
}) {
  return (
    <DashboardShellProvider>
      <DashboardSessionProvider initialUser={initialUser}>
        <div className="dash-shell">
          <TokenRefresh />
          <DashboardSidebar />
          <main className="dash-main">
            <DashboardTopBar />
            <DashboardAuthGate>
              <RealtimeProvider>
                <TasteMindProvider>{children}</TasteMindProvider>
              </RealtimeProvider>
            </DashboardAuthGate>
            <RealtimeIndicator />
          </main>
        </div>
      </DashboardSessionProvider>
    </DashboardShellProvider>
  );
}
