import type { Metadata } from "next";
import StaffView from "@/components/dashboard/StaffView";

export const metadata: Metadata = {
  title: "Staff - Metavision",
  description: "Manage your restaurant staff and their roles.",
};

export default function StaffPage() {
  return <StaffView />;
}
