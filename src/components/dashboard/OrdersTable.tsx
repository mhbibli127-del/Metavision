import type { Order, OrderStatus } from "@/data/orders";

type OrdersTableProps = {
  orders: Order[];
};

function statusClass(status: OrderStatus): string {
  switch (status) {
    case "Completed":
      return "dash-status dash-status--completed";
    case "Pending":
      return "dash-status dash-status--pending";
    case "Preparing":
      return "dash-status dash-status--preparing";
  }
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th scope="col">ORDER ID</th>
            <th scope="col">ITEM</th>
            <th scope="col">AMOUNT</th>
            <th scope="col">STATUS</th>
            <th scope="col">DATE</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <span className="dash-order-id">{order.id}</span>
              </td>
              <td>{order.item}</td>
              <td>{order.amount.toFixed(2)} AZN</td>
              <td>
                <span className={statusClass(order.status)}>{order.status}</span>
              </td>
              <td className="dash-table-date">{order.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
