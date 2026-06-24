import type { Metadata } from "next";
import InventoryView from "@/components/dashboard/InventoryView";

export const metadata: Metadata = {
  title: "Inventory - Metavision",
  description: "Manage your restaurant inventory and stock levels.",
};

export default function InventoryPage() {
  return <InventoryView />;
}
