import type { Metadata } from "next";
import PredictionsView from "@/components/dashboard/PredictionsView";

export const metadata: Metadata = {
  title: "Predictions - Metavision",
  description: "AI prediction stream for demand and behavior forecasting.",
};

export default function PredictionsPage() {
  return <PredictionsView />;
}
