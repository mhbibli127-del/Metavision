import type { Metadata } from "next";
import TasteMindDashboardView from "@/components/dashboard/tastemind/TasteMindDashboardView";

export const metadata: Metadata = {
  title: "TasteMind Dashboard - Metavision",
  description: "Bloomberg-grade food intelligence dashboard powered by TasteMind AI.",
};

export default function TasteMindDashboardPage() {
  return (
    <div className="dash-page tm-page">
      <TasteMindDashboardView />
    </div>
  );
}
