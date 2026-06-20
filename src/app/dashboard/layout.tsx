import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardAuthGate from "@/components/dashboard/DashboardAuthGate";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">
        <DashboardAuthGate>{children}</DashboardAuthGate>
      </main>
    </div>
  );
}
