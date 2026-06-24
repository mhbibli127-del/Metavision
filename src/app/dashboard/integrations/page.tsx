import type { Metadata } from "next";
import IntegrationsView from "@/components/dashboard/IntegrationsView";

export const metadata: Metadata = {
  title: "Integrations — Metavision",
  description: "Connect Square, Toast and external POS systems.",
};

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
