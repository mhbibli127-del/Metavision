import type { Metadata } from "next";
import TasteDnaView from "@/components/dashboard/TasteDnaView";

export const metadata: Metadata = {
  title: "Taste DNA - Metavision",
  description: "Taste psychology model and behavioral profile.",
};

export default function TasteDnaPage() {
  return <TasteDnaView />;
}
