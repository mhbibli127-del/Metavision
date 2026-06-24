import type { Metadata } from "next";
import AIIntegrationView from "@/components/dashboard/AIIntegrationView";

export const metadata: Metadata = {
  title: "AI Integration - Metavision",
  description: "Test and monitor AI backend connectivity.",
};

export default function AIIntegrationPage() {
  return <AIIntegrationView />;
}
