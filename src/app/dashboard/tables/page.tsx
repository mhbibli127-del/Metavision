import type { Metadata } from "next";
import TablesView from "@/components/dashboard/TablesView";

export const metadata: Metadata = {
  title: "Tables — Metavision",
  description: "Floor plan and seating capacity.",
};

export default function TablesPage() {
  return <TablesView />;
}
