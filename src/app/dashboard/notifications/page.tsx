import type { Metadata } from "next";
import NotificationsView from "@/components/dashboard/NotificationsView";

export const metadata: Metadata = {
  title: "Notifications - Metavision",
  description: "View and manage your notifications.",
};

export default function NotificationsPage() {
  return <NotificationsView />;
}
