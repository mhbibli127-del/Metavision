import type { Metadata } from "next";
import SubscriptionView from "@/components/dashboard/SubscriptionView";

export const metadata: Metadata = {
  title: "Subscription - Metavision",
  description: "Manage your subscription plan and billing.",
};

export default function SubscriptionPage() {
  return <SubscriptionView />;
}
