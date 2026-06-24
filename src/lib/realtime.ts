import { redisPublish } from "@/lib/redis";

const EVENT_ALIASES: Record<string, string> = {
  order: "order_update",
  "order.updated": "order_update",
  table: "table_update",
  "table.updated": "table_update",
  reservation: "reservation_update",
  "reservation.updated": "reservation_update",
  menu: "menu_update",
  "menu.updated": "menu_update",
  inventory: "inventory_update",
  "inventory.updated": "inventory_update",
  staff: "staff_update",
  "staff.updated": "staff_update",
};

function normalizeEventType(type: string): string {
  return EVENT_ALIASES[type] ?? type;
}

/** Publish real-time events via Redis when available. */
export async function publishRealtimeEvent(
  type: string,
  restaurantId: string,
  data: unknown,
) {
  if (!process.env.REDIS_URL || !restaurantId) return;

  const channel = process.env.STREAM_CHANNEL ?? "tastemind:live";
  const message = JSON.stringify({
    type: normalizeEventType(type),
    restaurantId,
    data,
    timestamp: new Date().toISOString(),
  });

  await redisPublish(channel, message);
}
