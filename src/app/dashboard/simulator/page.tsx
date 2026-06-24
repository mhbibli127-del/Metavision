import type { Metadata } from "next";
import SimulatorView from "@/components/dashboard/SimulatorView";

export const metadata: Metadata = {
  title: "Restaurant Simulator - Metavision",
  description: "AI scenario simulator for restaurant success modeling.",
};

export default function SimulatorPage() {
  return <SimulatorView />;
}
