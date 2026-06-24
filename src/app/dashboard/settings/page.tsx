import type { Metadata } from "next";
import SettingsView from "@/components/dashboard/SettingsView";

export const metadata: Metadata = {
  title: "TasteMind Settings - Metavision",
  description: "Control panel for intelligence thresholds and advisor behavior.",
};

export default function TasteMindSettingsPage() {
  return <SettingsView />;
}
