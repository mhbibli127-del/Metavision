import { connectDb } from "@/lib/mongodb";
import { ReservationModel, doc } from "@/lib/models";
import { getDbUser, requireRestaurant } from "@/lib/db/session";
import { writeAuditLog, type AuditInput } from "@/lib/enterprise/audit";
import { notifyRestaurantUpdate } from "@/lib/notify";

export type CreateReservationInput = {
  guest: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  status?: "Confirmed" | "Cancelled";
  table?: string;
  notes?: string;
};

function mapReservation(record: { id: string } & Record<string, unknown>, table?: string) {
  const status = String(record.status);
  return {
    id: record.id,
    guest: String(record.name),
    phone: String(record.phone),
    table: table ?? String(record.tableId ?? "—"),
    isVip: false,
    guests: Number(record.partySize),
    date: new Date(String(record.date)).toLocaleDateString("en-GB"),
    day: new Date(String(record.date)).toLocaleDateString("az-AZ", { weekday: "long" }),
    time: String(record.time),
    status: status === "CANCELLED" ? ("Cancelled" as const) : ("Confirmed" as const),
    depositAmount: Number(record.depositAmount ?? 0),
    depositPaid: Boolean(record.depositPaid),
    smsReminderSent: Boolean(record.smsReminderSent),
  };
}

export async function updateReservationStatus(
  reservationId: string,
  status: "Confirmed" | "Cancelled",
  audit: {
    userId: string;
    restaurantId: string;
    organizationId?: string;
    branchId?: string;
    ip?: string;
  },
) {
  const user = await getDbUser();
  const restaurant = await requireRestaurant();
  if (!user) throw new Error("Unauthorized");

  const dbStatus = status === "Cancelled" ? "CANCELLED" : "CONFIRMED";
  await connectDb();

  const updated = doc(
    await ReservationModel.findOneAndUpdate(
      { _id: reservationId, restaurantId: restaurant.id },
      { $set: { status: dbStatus } },
      { new: true },
    ).lean(),
  );

  if (!updated) throw new Error("Reservation not found");

  await writeAuditLog({
    ...audit,
    action: "UPDATE",
    entity: "reservation",
    entityId: reservationId,
    summary: `Status → ${dbStatus}`,
  });

  await notifyRestaurantUpdate(restaurant.id, "reservation.updated", {
    id: reservationId,
    status: dbStatus,
  });

  return mapReservation(updated);
}

export async function createReservation(
  input: CreateReservationInput,
  audit?: Omit<AuditInput, "action" | "entity">,
) {
  const user = await getDbUser();
  const restaurant = await requireRestaurant();
  if (!user) throw new Error("Unauthorized");

  await connectDb();
  const dbStatus = input.status === "Cancelled" ? "CANCELLED" : "CONFIRMED";
  const created = doc(
    await ReservationModel.create({
      userId: user.id,
      restaurantId: restaurant.id,
      name: input.guest.trim(),
      phone: input.phone.trim(),
      date: new Date(input.date),
      time: input.time,
      partySize: Math.max(1, input.partySize),
      status: dbStatus,
      tableId: input.table?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
    }),
  );

  if (!created) throw new Error("Failed to create reservation");

  await writeAuditLog({
    userId: user.id,
    restaurantId: restaurant.id,
    ...audit,
    action: "CREATE",
    entity: "reservation",
    entityId: created.id,
    summary: `Reservation for ${input.guest}`,
  });

  await notifyRestaurantUpdate(restaurant.id, "reservation_update", { id: created.id, action: "create" });

  return mapReservation(created, input.table);
}
