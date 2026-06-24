import { tryConnectDb } from "@/lib/mongodb";
import {
  TableModel,
  StaffModel,
  SubscriptionModel,
  SiteContentModel,
  OrderModel,
  InventoryModel,
  ReservationModel,
  MenuItemModel,
  docs,
  doc,
} from "@/lib/models";
import { getUserRestaurant, getDbUser } from "@/lib/db/session";
import { fetchMarketTrends, compareWithCompetitors } from "@/lib/db/market";
import { fetchOrderStats } from "@/lib/db/dashboard";
import { asCurrency } from "@/lib/prisma-types";
import { parseJsonArray } from "@/lib/db/json-fields";

const zoneUi: Record<string, string> = {
  INDOOR: "Garden",
  OUTDOOR: "Garden",
  TERRACE: "Terrace",
  VIP: "VIP",
};

const statusUi: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  MAINTENANCE: "Available",
};

export async function fetchTables() {
  const restaurant = await getUserRestaurant();
  if (!restaurant) return [];

  if (!(await tryConnectDb())) return [];

  const tables = docs(
    await TableModel.find({ restaurantId: restaurant.id }).sort({ number: 1 }).lean(),
  );

  return tables.map((t, idx) => ({
    id: t.id,
    number: t.number,
    status: statusUi[String(t.status)] as "Available" | "Occupied" | "Reserved",
    zone: zoneUi[String(t.zone)] as "Garden" | "VIP" | "Terrace",
    seats: Number(t.capacity),
    posX: t.posX != null ? Number(t.posX) : (idx % 4) * 100 + 20,
    posY: t.posY != null ? Number(t.posY) : Math.floor(idx / 4) * 100 + 20,
    width: t.width != null ? Number(t.width) : 80,
    height: t.height != null ? Number(t.height) : 80,
  }));
}

const roleUi: Record<string, string> = {
  MANAGER: "manager",
  CHEF: "chef",
  WAITER: "waiter",
  BARTENDER: "bartender",
  HOST: "host",
  CLEANER: "cleaner",
};

const statusStaffUi: Record<string, string> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "on_leave",
};

export async function fetchStaff() {
  const restaurant = await getUserRestaurant();
  if (!restaurant) return [];

  if (!(await tryConnectDb())) return [];

  const staff = docs(
    await StaffModel.find({ restaurantId: restaurant.id }).sort({ hireDate: 1 }).lean(),
  );

  return staff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone,
    email: s.email ?? undefined,
    role: roleUi[String(s.role)],
    status: statusStaffUi[String(s.status)],
    hireDate: s.hireDate,
    salary: s.salary ? Number(s.salary) : undefined,
    avatar: s.avatar ?? undefined,
  }));
}

export async function fetchSubscription() {
  const user = await getDbUser();
  if (!user) return { current: null, plans: [] };

  const db = await tryConnectDb();
  if (!db) return { current: null, plans: [] };

  const [sub, plansRow] = await Promise.all([
    SubscriptionModel.findOne({ userId: user.id }).lean(),
    SiteContentModel.findOne({ section: "subscription_plans" }).lean(),
  ]);

  const plans = plansRow?.items ? (JSON.parse(String(plansRow.items)) as unknown[]) : [];

  return {
    current: sub
      ? {
          plan: String(sub.plan).toLowerCase(),
          status: String(sub.status).toLowerCase(),
          startDate: sub.startDate,
          endDate: sub.endDate,
          autoRenew: Boolean(sub.autoRenew),
        }
      : null,
    plans,
  };
}

export async function fetchRestaurantInfo() {
  const restaurant = await getUserRestaurant();
  if (!restaurant) return null;

  return {
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    openingHours: restaurant.openingHours,
    phone: restaurant.phone,
    email: restaurant.email,
    website: restaurant.website ?? "",
    parking: restaurant.parking ?? "",
    amenities: restaurant.amenities ?? "",
    activeCampaigns: restaurant.activeCampaigns ?? "",
    paymentMethods: parseJsonArray(restaurant.paymentMethods),
    currency: restaurant.currency,
    cuisine: parseJsonArray(restaurant.cuisine),
  };
}

/** TasteMind — yalnız real DB siqnalları */
export async function buildTasteMindPayload() {
  const restaurant = await getUserRestaurant();
  const user = await getDbUser();
  const city = restaurant?.city ?? "Baku";
  const currency = asCurrency(restaurant?.currency);

  const trends = await fetchMarketTrends(city);
  const stats = await fetchOrderStats(currency).catch(() => ({
    revenue: 0,
    todayDelta: 0,
    total: 0,
    completed: 0,
    pending: 0,
    currency,
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersRaw, inventory, reservations, tables, competitorData] = await Promise.all([
    user
      ? tryConnectDb().then((db) =>
          db ? OrderModel.find({ userId: user.id }).sort({ createdAt: -1 }).limit(15).lean() : [],
        )
      : Promise.resolve([]),
    restaurant
      ? tryConnectDb().then((db) =>
          db ? InventoryModel.find({ restaurantId: restaurant.id }).sort({ quantity: 1 }).lean() : [],
        )
      : Promise.resolve([]),
    restaurant
      ? tryConnectDb().then((db) =>
          db
            ? ReservationModel.find({ restaurantId: restaurant.id, status: { $ne: "CANCELLED" } })
                .sort({ date: 1 })
                .limit(10)
                .lean()
            : [],
        )
      : Promise.resolve([]),
    restaurant
      ? tryConnectDb().then((db) =>
          db ? TableModel.find({ restaurantId: restaurant.id }).lean() : [],
        )
      : Promise.resolve([]),
    restaurant ? compareWithCompetitors(restaurant.id, currency).catch(() => null) : Promise.resolve(null),
  ]);

  const menuIds = [
    ...new Set(
      ordersRaw.flatMap((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return items.map((i) => String((i as { menuItemId?: string }).menuItemId ?? ""));
      }),
    ),
  ].filter(Boolean);
  const menuDocs =
    menuIds.length > 0
      ? await MenuItemModel.find({ _id: { $in: menuIds } })
          .select("name")
          .lean()
      : [];
  const menuNames = new Map(menuDocs.map((m) => [m._id, m.name]));

  const orders = docs(ordersRaw as Array<{ _id: string } & Record<string, unknown>>).map((o) => ({
    ...o,
    items: (Array.isArray(o.items) ? o.items : []).map((item) => ({
      ...(item as Record<string, unknown>),
      menuItem: { name: menuNames.get(String((item as { menuItemId?: string }).menuItemId)) ?? "Məhsul" },
    })),
  }));

  const pendingOrders = orders.filter(
    (o) => String((o as Record<string, unknown>).status) === "PENDING" || String((o as Record<string, unknown>).status) === "PREPARING",
  ).length;
  const todayOrders = orders.filter((o) => new Date(String((o as Record<string, unknown>).createdAt)) >= today);
  const lowStock = inventory.filter((i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK");
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;
  const reservedTables = tables.filter((t) => t.status === "RESERVED").length;

  const dishCounts = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const row = item as { menuItem?: { name?: unknown }; quantity?: unknown; price?: unknown };
      const name = String(row.menuItem?.name ?? "Məhsul");
      const hit = dishCounts.get(name) ?? { name, qty: 0, revenue: 0 };
      hit.qty += Number(row.quantity);
      hit.revenue += Number(row.price) * Number(row.quantity);
      dishCounts.set(name, hit);
    }
  }
  const topDishes = [...dishCounts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const topTrend = trends[0];
  const azTrend = trends.find((t) => t.cuisine === "Azerbaijani") ?? topTrend;
  const competitorCount = competitorData?.competitorCount ?? 0;

  const tasteDnaScores = [
    {
      key: "local",
      label: "Yerli mətbəx tələbi",
      value: Math.round(azTrend?.momentum ?? 0),
      trend: (azTrend?.demandChange ?? 0) >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      key: "revenue",
      label: "Gəlir dinamikası",
      value: Math.min(99, Math.max(5, 50 + Math.round(stats.todayDelta))),
      trend: stats.todayDelta >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      key: "occupancy",
      label: "Masa doluluğu",
      value: tables.length ? Math.round(((occupiedTables + reservedTables) / tables.length) * 100) : 0,
      trend: occupiedTables > reservedTables ? ("up" as const) : ("stable" as const),
    },
    {
      key: "stock",
      label: "Anbar riski",
      value: Math.min(99, lowStock.length * 18 + (lowStock.some((i) => i.status === "OUT_OF_STOCK") ? 40 : 0)),
      trend: lowStock.length > 0 ? ("down" as const) : ("stable" as const),
    },
  ];

  const topDish = topDishes[0];
  const predictionCards = [
    {
      id: "pred-top-dish",
      message: topDish
        ? `Ən çox satılan: ${topDish.name} (${topDish.qty} sifariş, ${topDish.revenue.toFixed(0)} ${currency})`
        : "Hələ sifariş məlumatı yoxdur — menyu aktivləşdirin",
      confidence: topDish ? 92 : 40,
      horizon: "bu gün",
      direction: "up" as const,
      impact: "high" as const,
      linkedTrendCity: city,
    },
    {
      id: "pred-revenue",
      message: `Günlük gəlir: ${stats.revenue.toFixed(2)} ${currency} (${stats.todayDelta >= 0 ? "+" : ""}${stats.todayDelta}% dünənə nisbətən)`,
      confidence: Math.min(95, 70 + Math.abs(stats.todayDelta)),
      horizon: "24s",
      direction: stats.todayDelta >= 0 ? ("up" as const) : ("down" as const),
      impact: "high" as const,
      linkedTrendCity: city,
    },
    {
      id: "pred-market",
      message: topTrend
        ? `${city}: ${topTrend.cuisine} momentum ${topTrend.momentum}% (tələb ${topTrend.demandChange > 0 ? "+" : ""}${topTrend.demandChange}%)`
        : "Bazar trendi yüklənir",
      confidence: Math.round(topTrend?.confidence ?? 75),
      horizon: "7g",
      direction: (topTrend?.demandChange ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      impact: "medium" as const,
      linkedTrendCity: city,
    },
    {
      id: "pred-competitive",
      message:
        competitorCount > 0
          ? `${competitorCount} rəqib monitorinqdə${competitorData?.insights[0] ? ` — ${competitorData.insights[0]}` : ""}`
          : "Rəqib məlumatı yoxdur",
      confidence: competitorCount > 0 ? 88 : 50,
      horizon: "canlı",
      direction: "up" as const,
      impact: "medium" as const,
      linkedTrendCity: city,
    },
  ];

  const globalTrends = trends.map((t) => ({
    region: t.region,
    city: t.city,
    cuisine: t.cuisine,
    momentum: t.momentum,
    demandChange: t.demandChange,
    confidence: t.confidence,
    observedAt: t.observedAt,
  }));

  const contextSignals = [
    {
      key: "orders_pending",
      label: "Gözləyən sifariş",
      value: pendingOrders,
      unit: "ədəd",
      influence: pendingOrders > 3 ? ("high" as const) : ("low" as const),
    },
    {
      key: "orders_today",
      label: "Bu gün sifariş",
      value: todayOrders.length,
      unit: "ədəd",
      influence: todayOrders.length > 5 ? ("high" as const) : ("medium" as const),
    },
    {
      key: "tables",
      label: "Dolu masa",
      value: occupiedTables,
      unit: `/${tables.length || "—"}`,
      influence: occupiedTables >= tables.length * 0.7 ? ("high" as const) : ("medium" as const),
    },
    {
      key: "reservations",
      label: "Aktiv rezerv",
      value: reservations.length,
      unit: "ədəd",
      influence: reservations.length > 4 ? ("high" as const) : ("low" as const),
    },
    {
      key: "stock",
      label: "Aşağı stok",
      value: lowStock.length,
      unit: "məhsul",
      influence: lowStock.length > 0 ? ("high" as const) : ("low" as const),
    },
  ];

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const liveFeed: {
    id: string;
    timestamp: string;
    time: string;
    category: string;
    title: string;
    detail: string;
    severity: "info" | "alert" | "success";
  }[] = [];

  for (const o of orders.slice(0, 8)) {
    const row = o as Record<string, unknown> & { id: string; items?: Array<{ menuItem?: { name?: unknown }; quantity?: unknown; price?: unknown }> };
    const items = Array.isArray(row.items) ? row.items : [];
    const main = String(items[0]?.menuItem?.name ?? "Sifariş");
    const status = String(row.status);
    const statusAz =
      status === "COMPLETED" || status === "SERVED"
        ? "tamamlandı"
        : status === "PREPARING" || status === "READY"
          ? "hazırlanır"
          : status === "CANCELLED"
            ? "ləğv"
            : "gözləyir";
    liveFeed.push({
      id: `order-${row.id}`,
      timestamp: new Date(String(row.createdAt)).toISOString(),
      time: fmtTime(new Date(String(row.createdAt))),
      category: "order",
      title: String(row.orderNumber),
      detail: `${main} · ${Number(row.total).toFixed(2)} ${currency} · ${statusAz}`,
      severity: status === "CANCELLED" ? "alert" : status === "COMPLETED" ? "success" : "info",
    });
  }

  for (const r of reservations.slice(0, 5)) {
    const row = r as Record<string, unknown> & { _id: string };
    liveFeed.push({
      id: `res-${row._id}`,
      timestamp: new Date(String(row.createdAt)).toISOString(),
      time: fmtTime(new Date(String(row.createdAt))),
      category: "reservation",
      title: String(row.name),
      detail: `${new Date(String(row.date)).toLocaleDateString("az-AZ")} ${String(row.time)} · ${Number(row.partySize)} nəfər · ${String(row.status)}`,
      severity: "info",
    });
  }

  for (const item of lowStock.slice(0, 5)) {
    const row = item as Record<string, unknown> & { _id: string };
    liveFeed.push({
      id: `inv-${row._id}`,
      timestamp: new Date(String(row.updatedAt ?? row.createdAt)).toISOString(),
      time: fmtTime(new Date(String(row.updatedAt ?? row.createdAt))),
      category: "inventory",
      title: String(row.name),
      detail: `${row.quantity}${String(row.unit)} qaldı (min ${row.minQuantity})`,
      severity: String(row.status) === "OUT_OF_STOCK" ? "alert" : "alert",
    });
  }

  for (const t of trends.slice(0, 3)) {
    liveFeed.push({
      id: `mkt-${t.cuisine}`,
      timestamp: t.observedAt,
      time: fmtTime(new Date(t.observedAt)),
      category: "market",
      title: t.cuisine,
      detail: `${city} bazarı: momentum ${t.momentum}%, tələb ${t.demandChange > 0 ? "+" : ""}${t.demandChange}%`,
      severity: t.demandChange < 0 ? "alert" : "info",
    });
  }

  liveFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const incidents = lowStock.map((item) => {
    const row = item as Record<string, unknown>;
    const qty = Number(row.quantity);
    const minQty = Number(row.minQuantity);
    const status = String(row.status);
    return {
      incident: `${String(row.name)} — kritik stok`,
      effect: `${qty}${String(row.unit)} qaldı`,
      effectPercent: status === "OUT_OF_STOCK" ? -100 : -Math.round((1 - qty / minQty) * 100),
      recommendation:
        status === "OUT_OF_STOCK"
          ? "Dərhal təchizat sifarişi verin və menyudan müvəqqəti çıxarın"
          : "48 saat ərzində təchizat planlaşdırın",
      detectedAt: new Date(String(row.updatedAt ?? row.createdAt)).toISOString(),
    };
  });

  if (pendingOrders > 2) {
    incidents.unshift({
      incident: `${pendingOrders} sifariş gözləyir`,
      effect: "Mətbəx yüklənməsi",
      effectPercent: -pendingOrders * 8,
      recommendation: "Mətbəx prioritet sırasını yeniləyin və hazırlıq vaxtını yoxlayın",
      detectedAt: new Date().toISOString(),
    });
  }

  const opsSnapshot = {
    restaurantName: restaurant?.name ?? "Restoran",
    city,
    currency,
    revenue: stats.revenue,
    todayDelta: stats.todayDelta,
    totalOrders: stats.total,
    pendingOrders,
    completedOrders: stats.completed ?? 0,
    todayOrderCount: todayOrders.length,
    lowStockCount: lowStock.length,
    activeReservations: reservations.length,
    tablesTotal: tables.length,
    tablesOccupied: occupiedTables,
    tablesReserved: reservedTables,
    competitorCount,
    topDishes,
    updatedAt: new Date().toISOString(),
  };

  return {
    tasteDnaScores,
    predictionCards,
    globalTrends,
    contextSignals,
    marketAlerts: trends.slice(0, 4).map(
      (t) => `${t.cuisine} (${city}): tələb ${t.demandChange > 0 ? "+" : ""}${t.demandChange}%`,
    ),
    liveFeed,
    opsSnapshot,
    incidents,
  };
}
