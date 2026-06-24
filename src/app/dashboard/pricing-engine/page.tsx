import type { Metadata } from "next";
import PricingEngineView from "@/components/dashboard/PricingEngineView";

export const metadata: Metadata = {
  title: "Pricing Engine — Metavision",
  description: "Autopilot dynamic pricing for your restaurant menu.",
};

export default function PricingEnginePage() {
  return <PricingEngineView />;
}
