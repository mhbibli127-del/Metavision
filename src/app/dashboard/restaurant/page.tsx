import type { Metadata } from "next";
import RestaurantInfoView from "@/components/dashboard/RestaurantInfoView";

export const metadata: Metadata = {
  title: "Restaurant Info — Metavision",
  description: "Manage your public profile and business details.",
};

export default function RestaurantPage() {
  return <RestaurantInfoView />;
}
