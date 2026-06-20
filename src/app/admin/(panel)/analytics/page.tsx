import type { Metadata } from "next";
import AdminAnalyticsView from "@/components/admin/AdminAnalyticsView";

export const metadata: Metadata = {
  title: "Analytics — Metavision Admin",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsView />;
}
