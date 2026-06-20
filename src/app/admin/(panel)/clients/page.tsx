import type { Metadata } from "next";
import AdminClientsView from "@/components/admin/AdminClientsView";

export const metadata: Metadata = {
  title: "Clients — Metavision Admin",
};

export default function AdminClientsPage() {
  return <AdminClientsView />;
}
