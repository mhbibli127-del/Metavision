import type { Metadata } from "next";
import ApiAccessView from "@/components/dashboard/ApiAccessView";

export const metadata: Metadata = {
  title: "API Access - Metavision",
  description: "Internal AI endpoints and integration contracts.",
};

export default function ApiAccessPage() {
  return <ApiAccessView />;
}
