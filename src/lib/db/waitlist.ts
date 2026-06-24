import { connectDb } from "@/lib/mongodb";
import { WaitlistModel, doc, docs } from "@/lib/models";
import { requireRestaurant } from "@/lib/db/session";
import { writeAuditLog } from "@/lib/enterprise/audit";
import { notifyRestaurantUpdate } from "@/lib/notify";

export type WaitlistEntry = {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  quotedWaitMin: number;
  status: "waiting" | "seated" | "left";
  createdAt: string;
  notes?: string;
};

function mapEntry(r: { id: string } & Record<string, unknown>): WaitlistEntry {
  const status = String(r.status).toLowerCase();
  return {
    id: r.id,
    name: String(r.name),
    phone: String(r.phone),
    partySize: Number(r.partySize),
    quotedWaitMin: Number(r.quotedWaitMin ?? 15),
    status: status === "seated" ? "seated" : status === "left" ? "left" : "waiting",
    createdAt: new Date(String(r.createdAt)).toISOString(),
    notes: r.notes ? String(r.notes) : undefined,
  };
}

export async function fetchWaitlist(): Promise<WaitlistEntry[]> {
  const restaurant = await requireRestaurant();
  await connectDb();
  const rows = docs(
    await WaitlistModel.find({ restaurantId: restaurant.id, status: { $ne: "LEFT" } })
      .sort({ createdAt: 1 })
      .lean(),
  );
  return rows.map(mapEntry);
}

export async function addWaitlistEntry(
  input: { name: string; phone: string; partySize: number; quotedWaitMin?: number; notes?: string },
  audit: { userId: string; restaurantId: string; organizationId?: string; branchId?: string; ip?: string },
) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = doc(
    await WaitlistModel.create({
      restaurantId: restaurant.id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      partySize: Math.max(1, input.partySize),
      quotedWaitMin: input.quotedWaitMin ?? 15,
      notes: input.notes?.trim(),
      status: "WAITING",
    }),
  );
  if (!created) throw new Error("Failed to add waitlist entry");
  await writeAuditLog({ ...audit, action: "CREATE", entity: "waitlist", entityId: created.id });
  await notifyRestaurantUpdate(restaurant.id, "waitlist.updated", { id: created.id });
  return mapEntry(created);
}

export async function updateWaitlistStatus(
  id: string,
  status: "waiting" | "seated" | "left",
  audit: { userId: string; restaurantId: string; organizationId?: string; branchId?: string; ip?: string },
) {
  const restaurant = await requireRestaurant();
  const dbStatus = status.toUpperCase();
  await connectDb();
  const updated = doc(
    await WaitlistModel.findOneAndUpdate(
      { _id: id, restaurantId: restaurant.id },
      { $set: { status: dbStatus } },
      { new: true },
    ).lean(),
  );
  if (!updated) throw new Error("Waitlist entry not found");
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "waitlist", entityId: id, summary: `Status → ${dbStatus}` });
  await notifyRestaurantUpdate(restaurant.id, "waitlist.updated", { id, status: dbStatus });
  return mapEntry(updated);
}
