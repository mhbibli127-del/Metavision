import { connectDb } from "@/lib/mongodb";
import { OrderModel, MenuItemModel, docs } from "@/lib/models";
import { getDbUser } from "@/lib/db/session";

export type KdsTicket = {
  orderNumber: string;
  status: string;
  tableId?: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  createdAt: string;
  elapsedMin: number;
};

export async function fetchKitchenTickets(): Promise<KdsTicket[]> {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  await connectDb();

  const orders = docs(
    await OrderModel.find({
      userId: user.id,
      status: { $in: ["PENDING", "PREPARING", "READY"] },
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean(),
  );

  const menuIds = [
    ...new Set(
      orders.flatMap((o) =>
        (Array.isArray(o.items) ? o.items : []).map((i) => String((i as { menuItemId?: string }).menuItemId ?? "")),
      ),
    ),
  ].filter(Boolean);

  const menuItems = menuIds.length
    ? docs(await MenuItemModel.find({ _id: { $in: menuIds } }).select("name").lean())
    : [];
  const names = new Map(menuItems.map((m) => [m.id, String(m.name)]));

  const now = Date.now();
  return orders.map((o) => {
    const created = new Date(String(o.createdAt)).getTime();
    const items = (Array.isArray(o.items) ? o.items : []).map((i) => {
      const row = i as { menuItemId?: string; quantity?: number; notes?: string };
      return {
        name: names.get(String(row.menuItemId ?? "")) ?? "Item",
        quantity: Number(row.quantity ?? 1),
        notes: row.notes ? String(row.notes) : undefined,
      };
    });
    return {
      orderNumber: String(o.orderNumber),
      status: String(o.status),
      tableId: o.tableId ? String(o.tableId) : undefined,
      items,
      createdAt: new Date(String(o.createdAt)).toISOString(),
      elapsedMin: Math.max(0, Math.round((now - created) / 60_000)),
    };
  });
}
