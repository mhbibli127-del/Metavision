"use client";

import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <AdminTopbar />
        <AdminAuthGate>{children}</AdminAuthGate>
      </main>
    </div>
  );
}
