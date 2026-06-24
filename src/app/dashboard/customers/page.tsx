import type { Metadata } from "next";
import CustomersView from "@/components/dashboard/CustomersView";

export const metadata: Metadata = {
  title: "Customers - Metavision",
  description: "Manage your customer database and history.",
};

export default function CustomersPage() {
  return <CustomersView />;
}
