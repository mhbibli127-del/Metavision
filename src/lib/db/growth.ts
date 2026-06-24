import { connectDb } from "@/lib/mongodb";
import {
  CustomerCampaignModel,
  PurchaseOrderModel,
  ShiftModel,
  StaffModel,
  MenuTemplateModel,
  TableModel,
  WaitlistModel,
  ReservationModel,
  doc,
  docs,
} from "@/lib/models";
import { requireRestaurant } from "@/lib/db/session";
import { writeAuditLog, type AuditInput } from "@/lib/enterprise/audit";
import { createReservation } from "@/lib/db/reservations";
import { updateWaitlistStatus } from "@/lib/db/waitlist";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// ─── Campaigns ─────────────────────────────────────────────────────────────

export async function fetchCampaigns() {
  const restaurant = await requireRestaurant();
  await connectDb();
  return docs(await CustomerCampaignModel.find({ restaurantId: restaurant.id }).sort({ createdAt: -1 }).lean());
}

export async function createCampaign(
  input: { name: string; segment: string; message: string; channel?: string },
  audit: Omit<AuditInput, "action" | "entity">,
) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = doc(
    await CustomerCampaignModel.create({
      restaurantId: restaurant.id,
      name: input.name,
      segment: input.segment,
      message: input.message,
      channel: input.channel ?? "sms",
      status: "DRAFT",
    }),
  );
  await writeAuditLog({ ...audit, action: "CREATE", entity: "campaign", entityId: created!.id });
  return created;
}

export async function sendCampaign(id: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const campaign = doc(await CustomerCampaignModel.findOne({ _id: id, restaurantId: restaurant.id }).lean());
  if (!campaign) throw new Error("Campaign not found");
  await CustomerCampaignModel.updateOne({ _id: id }, { $set: { status: "SENT", sentCount: 1 } });
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "campaign", entityId: id, summary: "Campaign sent" });
  return { ok: true, segment: campaign.segment };
}

// ─── Purchase orders ───────────────────────────────────────────────────────

export async function fetchPurchaseOrders() {
  const restaurant = await requireRestaurant();
  await connectDb();
  return docs(await PurchaseOrderModel.find({ restaurantId: restaurant.id }).sort({ createdAt: -1 }).lean());
}

export async function createPurchaseOrder(
  input: { vendorId: string; items: unknown[]; total: number; expectedAt?: string },
  audit: Omit<AuditInput, "action" | "entity">,
) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = doc(
    await PurchaseOrderModel.create({
      restaurantId: restaurant.id,
      vendorId: input.vendorId,
      items: JSON.stringify(input.items),
      total: input.total,
      expectedAt: input.expectedAt ? new Date(input.expectedAt) : undefined,
      status: "SUBMITTED",
    }),
  );
  await writeAuditLog({ ...audit, action: "CREATE", entity: "purchase_order", entityId: created!.id });
  return created;
}

// ─── Labor analytics ───────────────────────────────────────────────────────

export async function fetchLaborAnalytics() {
  const restaurant = await requireRestaurant();
  await connectDb();
  const [shifts, staff] = await Promise.all([
    ShiftModel.find({ restaurantId: restaurant.id }).lean(),
    StaffModel.find({ restaurantId: restaurant.id }).lean(),
  ]);
  const activeStaff = staff.filter((s) => s.status === "ACTIVE").length;
  const shiftHours = shifts.length * 8;
  const laborCost = staff.reduce((sum, s) => sum + Number(s.salary ?? 0), 0) / Math.max(1, staff.length);
  return {
    activeStaff,
    scheduledShifts: shifts.length,
    shiftHours,
    avgHourlyCost: Math.round(laborCost / 160),
    coverageRatio: shifts.length > 0 ? Math.min(1, shifts.length / Math.max(1, activeStaff)) : 0,
  };
}

// ─── Reservation deposit + SMS ─────────────────────────────────────────────

export async function updateReservationDeposit(
  id: string,
  depositAmount: number,
  depositPaid: boolean,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const updated = doc(
    await ReservationModel.findOneAndUpdate(
      { _id: id, restaurantId: restaurant.id },
      { $set: { depositAmount, depositPaid } },
      { new: true },
    ).lean(),
  );
  if (!updated) throw new Error("Reservation not found");
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "reservation", entityId: id, summary: "Deposit updated" });
  return updated;
}

export async function sendReservationReminder(id: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const row = await ReservationModel.findOne({ _id: id, restaurantId: restaurant.id }).lean();
  if (!row) throw new Error("Reservation not found");
  const dateStr = new Date(String(row.date)).toLocaleDateString("az-AZ");
  const msg = `Metavision: ${row.name}, ${dateStr} ${row.time} tarixində rezervasiyanız var. Gözləyirik!`;
  await sendWhatsAppMessage(String(row.phone), msg);
  await ReservationModel.updateOne({ _id: id }, { $set: { smsReminderSent: true, smsReminderAt: new Date() } });
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "reservation", entityId: id, summary: "SMS reminder sent" });
  return { ok: true };
}

// ─── Waitlist → reservation ────────────────────────────────────────────────

export async function convertWaitlistToReservation(
  waitlistId: string,
  input: { date: string; time: string },
  audit: Omit<AuditInput, "action" | "entity">,
) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const { WaitlistModel } = await import("@/lib/models");
  const entry = doc(await WaitlistModel.findOne({ _id: waitlistId, restaurantId: restaurant.id }).lean());
  if (!entry) throw new Error("Waitlist entry not found");
  const reservation = await createReservation(
    {
      guest: String(entry.name),
      phone: String(entry.phone),
      partySize: Number(entry.partySize),
      date: input.date,
      time: input.time,
    },
    audit,
  );
  await ReservationModel.updateOne({ _id: reservation.id }, { $set: { waitlistId } });
  await updateWaitlistStatus(waitlistId, "seated", {
    userId: audit.userId ?? "",
    restaurantId: audit.restaurantId ?? restaurant.id,
    organizationId: audit.organizationId,
    branchId: audit.branchId,
    ip: audit.ip,
  });
  return reservation;
}

// ─── Floor plan merge ──────────────────────────────────────────────────────

export async function mergeTables(primaryId: string, secondaryId: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const [a, b] = await Promise.all([
    TableModel.findOne({ _id: primaryId, restaurantId: restaurant.id }).lean(),
    TableModel.findOne({ _id: secondaryId, restaurantId: restaurant.id }).lean(),
  ]);
  if (!a || !b) throw new Error("Table not found");
  await TableModel.updateOne(
    { _id: primaryId },
    { $set: { capacity: Number(a.capacity) + Number(b.capacity), mergedWithId: secondaryId } },
  );
  await TableModel.updateOne({ _id: secondaryId }, { $set: { status: "MAINTENANCE", mergedWithId: primaryId } });
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "table", entityId: primaryId, summary: `Merged with ${secondaryId}` });
  return { ok: true };
}

export async function splitTable(tableId: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const table = await TableModel.findOne({ _id: tableId, restaurantId: restaurant.id }).lean();
  if (!table) throw new Error("Table not found");
  const mergedWithId = table.mergedWithId ? String(table.mergedWithId) : null;
  if (!mergedWithId) throw new Error("Table is not merged");

  const partner = await TableModel.findOne({ _id: mergedWithId, restaurantId: restaurant.id }).lean();
  if (!partner) throw new Error("Partner table not found");

  const halfA = Math.max(1, Math.floor(Number(table.capacity) / 2));
  const halfB = Math.max(1, Math.floor(Number(partner.capacity) / 2));

  await TableModel.updateOne(
    { _id: tableId },
    { $set: { capacity: halfA, mergedWithId: null }, $unset: { turnTimeMin: "" } },
  );
  await TableModel.updateOne(
    { _id: mergedWithId },
    { $set: { capacity: halfB, status: "AVAILABLE", mergedWithId: null } },
  );
  await writeAuditLog({ ...audit, action: "UPDATE", entity: "table", entityId: tableId, summary: `Split from ${mergedWithId}` });
  return { ok: true };
}

// ─── Menu template versioning ──────────────────────────────────────────────

export async function saveMenuTemplateVersion(organizationId: string, name: string, sourceRestaurantId: string, itemCount: number) {
  await connectDb();
  const latest = await MenuTemplateModel.findOne({ organizationId, name }).sort({ version: -1 }).lean();
  const version = latest ? Number(latest.version) + 1 : 1;
  return doc(
    await MenuTemplateModel.create({ organizationId, name, version, sourceRestaurantId, itemCount }),
  );
}

export async function listMenuTemplates(organizationId: string) {
  await connectDb();
  return docs(await MenuTemplateModel.find({ organizationId }).sort({ name: 1, version: -1 }).lean());
}
