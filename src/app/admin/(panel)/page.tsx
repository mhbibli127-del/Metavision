import type { Metadata } from "next";
import AdminDashboardView from "@/components/admin/AdminDashboardView";
import AdminEngineStatus from "@/components/admin/AdminEngineStatus";

export const metadata: Metadata = {
  title: "Admin Dashboard — Metavision",
};

export default function AdminPage() {
  return (
    <>
      <AdminDashboardView />
      <div style={{ marginTop: "1.5rem" }}>
        <AdminEngineStatus />
      </div>
    </>
  );
}
