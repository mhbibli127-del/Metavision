import type { Metadata } from "next";
import OrdersPageHeader from "@/components/dashboard/OrdersPageHeader";
import OrdersStats from "@/components/dashboard/OrdersStats";
import OrdersTable from "@/components/dashboard/OrdersTable";
import { staticOrders } from "@/data/orders";

export const metadata: Metadata = {
  title: "Orders — Metavision",
  description: "Manage and track all restaurant orders.",
};

export default function OrdersPage() {
  return (
    <div className="dash-page">
      <OrdersPageHeader />
      <OrdersStats />
      <OrdersTable orders={staticOrders} />
    </div>
  );
}
