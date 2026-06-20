import type { Metadata } from "next";
import ReservationsView from "@/components/dashboard/ReservationsView";

export const metadata: Metadata = {
  title: "Reservations — Metavision",
  description: "Manage and track all restaurant reservations.",
};

export default function ReservationsPage() {
  return <ReservationsView />;
}
