import type { Metadata } from "next";
import ReportsView from "@/components/dashboard/ReportsView";

export const metadata: Metadata = {
  title: "Reports - Metavision",
  description: "Generate and export business reports.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
