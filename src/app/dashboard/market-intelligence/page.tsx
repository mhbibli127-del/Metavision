import type { Metadata } from "next";
import MarketIntelligenceView from "@/components/dashboard/MarketIntelligenceView";

export const metadata: Metadata = {
  title: "Market Intelligence - Metavision",
  description: "Food market intelligence and risk-opportunity feed.",
};

export default function MarketIntelligencePage() {
  return <MarketIntelligenceView />;
}
