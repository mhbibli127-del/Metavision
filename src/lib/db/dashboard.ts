import { asCurrency, type Currency, type OrderStatus } from "@/lib/prisma-types";
import { tryConnectDb } from "@/lib/mongodb";
import {
  RestaurantModel,
  OrderModel,
  MenuItemModel,
  InventoryModel,
  CustomerModel,
  ReservationModel,
  docs,
} from "@/lib/models";
import { getDbUser, getUserRestaurant } from "@/lib/db/session";
import { convertCurrency } from "@/lib/currency";
import { parseJsonArray } from "@/lib/db/json-fields";
import { getCachedOrderStats } from "@/lib/cache/stats-cache";

function mapOrderStatus(s: OrderStatus): "Completed" | "Pending" | "Preparing" | "Cancelled" {
  const m: Record<OrderStatus, "Completed" | "Pending" | "Preparing" | "Cancelled"> = {
    PENDING: "Pending",
    PREPARING: "Preparing",
    READY: "Preparing",
    SERVED: "Completed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return m[s] ?? "Pending";
}

async function menuNameMap(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  if (!(await tryConnectDb())) return new Map<string, string>();
  const items = await MenuItemModel.find({ _id: { $in: ids } }).select("name").lean();
  return new Map(items.map((m) => [m._id, String(m.name)]));
}

export async function fetchOrdersForUser(displayCurrency?: Currency) {
  const user = await getDbUser();
  if (!user) return [];

  if (!(await tryConnectDb())) return [];

  const restaurant = await RestaurantModel.findOne({ userId: user.id }).lean();
  const currency = displayCurrency ?? asCurrency(restaurant?.currency);

  const orders = docs(
    await OrderModel.find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).lean(),
  );

  const menuIds = [
    ...new Set(
      orders.flatMap((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return items.map((i) => String((i as { menuItemId?: string }).menuItemId ?? ""));
      }),
    ),
  ].filter(Boolean);
  const names = await menuNameMap(menuIds);

  const result = [];
  for (const o of orders) {
    const total = Number(o.total);
    const converted =
      currency !== "AZN" ? (await convertCurrency(total, "AZN", currency)).amount : total;
    const firstItemId = Array.isArray(o.items) ? String((o.items[0] as { menuItemId?: string })?.menuItemId ?? "") : "";
    const mainItem = String((firstItemId && names.get(firstItemId)) || "Order");
    result.push({
      id: String(o.orderNumber),
      item: mainItem,
      amount: converted,
      currency,
      status: mapOrderStatus(o.status as OrderStatus),
      date: new Date(String(o.createdAt)).toLocaleDateString("en-GB"),
    });
  }
  return result;
}

export async function fetchOrderStats(displayCurrency?: Currency) {
  const user = await getDbUser();
  if (!user) {
    return { total: 0, completed: 0, pending: 0, revenue: 0, todayDelta: 0, currency: "AZN" as Currency };
  }

  if (!(await tryConnectDb())) {
    return { total: 0, completed: 0, pending: 0, revenue: 0, todayDelta: 0, currency: "AZN" as Currency };
  }

  const restaurant = await RestaurantModel.findOne({ userId: user.id }).lean();
  const currency = displayCurrency ?? asCurrency(restaurant?.currency);

  return getCachedOrderStats(user.id, currency, async () => {
    const orders = docs(await OrderModel.find({ userId: user.id }).lean());

    const completed = orders.filter((o) => o.status === "COMPLETED" || o.status === "SERVED").length;
    const pending = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;
    let revenue = orders.reduce((s, o) => s + Number(o.total), 0);

    if (currency !== "AZN") {
      revenue = (await convertCurrency(revenue, "AZN", currency)).amount;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(String(o.createdAt)) >= today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayOrders = orders.filter((o) => {
      const d = new Date(String(o.createdAt));
      return d >= yesterday && d < today;
    });
    const todayRev = todayOrders.reduce((s, o) => s + Number(o.total), 0);
    const yesterdayRev = yesterdayOrders.reduce((s, o) => s + Number(o.total), 0);
    const todayDelta = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 0;

    return {
      total: orders.length,
      completed,
      pending,
      revenue: Math.round(revenue * 100) / 100,
      todayDelta,
      currency,
    };
  });
}

export async function fetchMenuItems() {
  const restaurant = await getUserRestaurant();
  if (!restaurant || !(await tryConnectDb())) return [];
  const items = docs(
    await MenuItemModel.find({ restaurantId: restaurant.id })
      .sort({ category: 1, order: 1 })
      .lean(),
  );

  return items.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    description: m.description,
    price: Number(m.price),
    currency: restaurant.currency,
    image: m.image ?? undefined,
    available: m.available,
    featured: m.featured,
    preparationTime: m.preparationTime,
    calories: m.calories ?? undefined,
    tags: parseJsonArray(m.tags),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

export async function fetchInventory() {
  const restaurant = await getUserRestaurant();
  if (!restaurant || !(await tryConnectDb())) return [];
  const items = docs(
    await InventoryModel.find({ restaurantId: restaurant.id }).sort({ name: 1 }).lean(),
  );

  const statusMap: Record<string, "in_stock" | "low_stock" | "out_of_stock" | "discontinued"> = {
    IN_STOCK: "in_stock",
    LOW_STOCK: "low_stock",
    OUT_OF_STOCK: "out_of_stock",
    DISCONTINUED: "discontinued",
  };

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    minQuantity: i.minQuantity,
    costPerUnit: Number(i.costPerUnit),
    supplier: i.supplier ?? undefined,
    lastRestocked: i.lastRestocked ?? undefined,
    status: statusMap[String(i.status)],
  }));
}

export async function fetchCustomers() {
  const restaurant = await getUserRestaurant();
  if (!restaurant || !(await tryConnectDb())) return [];
  const items = docs(
    await CustomerModel.find({ restaurantId: restaurant.id }).sort({ totalSpent: -1 }).lean(),
  );

  return items.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? undefined,
    visits: c.visits,
    totalSpent: Number(c.totalSpent),
    lastVisit: c.lastVisit ?? undefined,
    notes: c.notes ?? undefined,
  }));
}

export async function fetchReservations() {
  const restaurant = await getUserRestaurant();
  if (!restaurant || !(await tryConnectDb())) return [];
  const items = docs(
    await ReservationModel.find({ restaurantId: restaurant.id }).sort({ date: -1 }).limit(50).lean(),
  );

  const statusMap: Record<string, "Confirmed" | "Cancelled"> = {
    CONFIRMED: "Confirmed",
    PENDING: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Confirmed",
    NO_SHOW: "Cancelled",
  };

  return items.map((r) => ({
    id: r.id,
    guest: r.name,
    phone: r.phone,
    table: r.tableId ?? "—",
    isVip: false,
    guests: r.partySize,
    date: new Date(String(r.date)).toLocaleDateString("en-GB"),
    day: new Date(String(r.date)).toLocaleDateString("az-AZ", { weekday: "long" }),
    time: r.time,
    status: statusMap[String(r.status)] ?? "Confirmed",
  }));
}

export async function fetchBusinessDataForAnalysis() {
  const restaurant = await getUserRestaurant();
  const user = await getDbUser();
  if (!restaurant || !user || !(await tryConnectDb())) {
    return {
      orders: [],
      reservations: [],
      inventory: [],
      customers: [],
      menu: [],
      revenue: { total: 0, todayDelta: 0 },
    };
  }

  const [orders, reservations, inventory, customers, menuItems] = await Promise.all([
    OrderModel.find({ userId: user!.id }).select("total status").lean(),
    ReservationModel.find({ restaurantId: restaurant.id, status: { $ne: "CANCELLED" } })
      .select("partySize status")
      .lean(),
    InventoryModel.find({ restaurantId: restaurant.id })
      .select("quantity minQuantity status costPerUnit")
      .lean(),
    CustomerModel.find({ restaurantId: restaurant.id }).select("visits totalSpent").lean(),
    MenuItemModel.find({ restaurantId: restaurant.id }).select("price available").lean(),
  ]);

  const stats = await fetchOrderStats(asCurrency(restaurant.currency));

  return {
    orders: orders.map((o) => ({
      amount: Number(o.total),
      status: mapOrderStatus(o.status as OrderStatus),
    })),
    reservations: reservations.map((r) => ({
      guests: Number(r.partySize),
      status: r.status === "CANCELLED" ? "Cancelled" : "Confirmed",
    })),
    inventory: inventory.map((i) => ({
      quantity: Number(i.quantity),
      minQuantity: Number(i.minQuantity),
      status: String(i.status).toLowerCase(),
      costPerUnit: Number(i.costPerUnit),
    })),
    customers: customers.map((c) => ({
      visits: Number(c.visits),
      totalSpent: Number(c.totalSpent),
    })),
    menu: menuItems.map((m) => ({
      price: Number(m.price),
      available: Boolean(m.available),
    })),
    revenue: { total: stats.revenue, todayDelta: stats.todayDelta },
  };
}
