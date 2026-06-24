export type OrderStatus = "Completed" | "Pending" | "Preparing" | "Cancelled";

export type Order = {
  id: string;
  item: string;
  amount: number;
  status: OrderStatus;
  date: string;
};
