import { connectDb } from "@/lib/mongodb";
import {
  NotificationModel,
  OrderModel,
  InventoryModel,
  ReservationModel,
  RestaurantModel,
  docs,
} from "@/lib/models";
import { getDbUser } from "@/lib/db/session";
import { parseJsonValue } from "@/lib/db/json-fields";

const typeUi: Record<string, string> = {
  ORDER: "order",
  RESERVATION: "reservation",
  PAYMENT: "payment",
  SYSTEM: "system",
  PROMOTION: "promotion",
  ALERT: "alert",
};

export async function ensureLiveNotifications(userId: string, restaurantId: string) {
  await connectDb();
  const existing = await NotificationModel.countDocuments({ userId });
  if (existing > 0) return;

  const [orders, inventory, reservations] = await Promise.all([
    OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
    InventoryModel.find({
      restaurantId,
      status: { $in: ["LOW_STOCK", "OUT_OF_STOCK"] },
    })
      .limit(3)
      .lean(),
    ReservationModel.find({ restaurantId, status: "CONFIRMED" })
      .sort({ date: 1 })
      .limit(2)
      .lean(),
  ]);

  const rows: { userId: string; type: string; title: string; message: string; read: boolean }[] = [];

  for (const o of orders) {
    const row = o as Record<string, unknown>;
    rows.push({
      userId,
      type: "ORDER",
      title: "Yeni sifariş",
      message: `Sifariş ${String(row.orderNumber)} — ${Number(row.total).toFixed(2)} AZN`,
      read: String(row.status) === "COMPLETED",
    });
  }

  for (const item of inventory) {
    const row = item as Record<string, unknown>;
    rows.push({
      userId,
      type: "ALERT",
      title: "Anbar xəbərdarlığı",
      message: `${String(row.name)}: ${Number(row.quantity)}${String(row.unit)} qaldı (min ${Number(row.minQuantity)})`,
      read: false,
    });
  }

  for (const r of reservations) {
    const row = r as Record<string, unknown>;
    rows.push({
      userId,
      type: "RESERVATION",
      title: "Rezervasiya",
      message: `${String(row.name)} — ${new Date(String(row.date)).toLocaleDateString("az-AZ")} ${String(row.time)}, ${Number(row.partySize)} nəfər`,
      read: false,
    });
  }

  rows.push({
    userId,
    type: "SYSTEM",
    title: "Metavision Intelligence aktivdir",
    message: "Market Intelligence, Meta Ads və rəqib monitorinqi hazırdır.",
    read: true,
  });

  if (rows.length) {
    await NotificationModel.insertMany(rows);
  }
}

export async function fetchNotifications() {
  const user = await getDbUser();
  if (!user) return [];

  await connectDb();
  const restaurant = await RestaurantModel.findOne({ userId: user.id }).lean();
  if (restaurant) {
    await ensureLiveNotifications(user.id, restaurant._id);
  }

  const items = docs(
    await NotificationModel.find({ userId: user.id }).sort({ createdAt: -1 }).limit(50).lean(),
  );

  return items.map((n) => {
    const row = n as Record<string, unknown>;
    const typeKey = String(row.type);
    return {
      id: String(row.id),
      type: (typeUi[typeKey] ?? typeKey.toLowerCase()) as
        | "order"
        | "reservation"
        | "payment"
        | "system"
        | "promotion"
        | "alert",
      title: String(row.title),
      message: String(row.message),
      read: Boolean(row.read),
      metadata: parseJsonValue<Record<string, unknown>>(row.metadata) ?? undefined,
      createdAt: new Date(String(row.createdAt)).toISOString(),
    };
  });
}

export async function markNotificationRead(id: string, read = true) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  await connectDb();
  await NotificationModel.updateMany({ _id: id, userId: user.id }, { $set: { read } });
}

export async function markAllNotificationsRead() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  await connectDb();
  await NotificationModel.updateMany({ userId: user.id, read: false }, { $set: { read: true } });
}

export async function deleteNotification(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  await connectDb();
  await NotificationModel.deleteMany({ _id: id, userId: user.id });
}
