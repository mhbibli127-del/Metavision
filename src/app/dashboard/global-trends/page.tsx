import type { Metadata } from "next";
import GlobalTrendsView from "@/components/dashboard/GlobalTrendsView";

export const metadata: Metadata = {
  title: "Global Trends - Metavision",
  description: "Food market trends for Baku restaurant industry.",
};

export default function GlobalTrendsPage() {
  return <GlobalTrendsView />;
}
