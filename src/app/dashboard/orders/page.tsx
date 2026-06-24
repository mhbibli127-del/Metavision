import type { Metadata } from "next";
import OrdersPageHeader from "@/components/dashboard/OrdersPageHeader";
import OrdersStats from "@/components/dashboard/OrdersStats";
import OrdersTable from "@/components/dashboard/OrdersTable";
import TasteMindIntelBanner from "@/components/dashboard/tastemind/TasteMindIntelBanner";
import { fetchOrdersForUser } from "@/lib/db/dashboard";

export const metadata: Metadata = {
  title: "Orders — Metavision",
  description: "Manage and track all restaurant orders.",
};

export default async function OrdersPage() {
  let orders: Awaited<ReturnType<typeof fetchOrdersForUser>> = [];
  try {
    orders = await fetchOrdersForUser();
  } catch {
    /* not authenticated */
  }

  return (
    <div className="dash-page">
      <TasteMindIntelBanner />
      <OrdersPageHeader />
      <OrdersStats />
      <OrdersTable orders={orders} />
    </div>
  );
}
