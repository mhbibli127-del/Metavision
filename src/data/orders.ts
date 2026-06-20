export type OrderStatus = "Completed" | "Pending" | "Preparing";

export type Order = {
  id: string;
  item: string;
  amount: number;
  status: OrderStatus;
  date: string;
};

/** Static mock stats — replace with API/database later */
export const mockDashboardStats = {
  total: 123,
  completed: 78,
  pending: 22,
  revenue: 5062,
  todayDelta: 12,
};

/** Static mock table rows — replace with API/database later */
export const staticOrders: Order[] = [
  { id: "#1042", item: "Plov", amount: 23.58, status: "Completed", date: "15/09/2026" },
  { id: "#1041", item: "Dolma", amount: 12.4, status: "Pending", date: "14/09/2026" },
  { id: "#1040", item: "Piroq", amount: 8.0, status: "Preparing", date: "13/09/2026" },
];

export function getOrderStats() {
  return mockDashboardStats;
}
