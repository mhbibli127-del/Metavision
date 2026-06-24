import {
  VendorModel,
  ExpenseModel,
  ShiftModel,
  StaffModel,
  doc,
  docs,
} from "@/lib/models";
import { connectDb } from "@/lib/mongodb";
import { requireRestaurant } from "@/lib/db/session";
import { writeAuditLog, type AuditInput } from "@/lib/enterprise/audit";

function auditBase(base: Omit<AuditInput, "action" | "entity">) {
  return base;
}

// ─── Vendors ────────────────────────────────────────────────────────────────

export async function fetchVendors() {
  const restaurant = await requireRestaurant();
  await connectDb();
  return docs(await VendorModel.find({ restaurantId: restaurant.id }).sort({ name: 1 }).lean());
}

export async function createVendor(data: Record<string, unknown>, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = await VendorModel.create({
    restaurantId: restaurant.id,
    name: String(data.name),
    contact: data.contact ? String(data.contact) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    email: data.email ? String(data.email) : undefined,
    category: data.category ? String(data.category) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
  });
  const v = doc(created.toObject())!;
  await writeAuditLog({ ...auditBase(audit), action: "CREATE", entity: "vendor", entityId: v.id });
  return fetchVendors();
}

export async function deleteVendor(id: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  await VendorModel.deleteOne({ _id: id, restaurantId: restaurant.id });
  await writeAuditLog({ ...auditBase(audit), action: "DELETE", entity: "vendor", entityId: id });
  return fetchVendors();
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function fetchExpenses() {
  const restaurant = await requireRestaurant();
  await connectDb();
  const rows = docs(await ExpenseModel.find({ restaurantId: restaurant.id }).sort({ date: -1 }).lean());
  return rows.map((e) => ({
    id: e.id,
    vendorId: e.vendorId,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    currency: String(e.currency ?? "AZN"),
    date: e.date,
    status: String(e.status).toLowerCase(),
  }));
}

export async function fetchFinanceSummary() {
  const expenses = await fetchExpenses();
  const paid = expenses.filter((e) => e.status === "paid");
  const pending = expenses.filter((e) => e.status === "pending");
  const totalPaid = paid.reduce((s, e) => s + e.amount, 0);
  const totalPending = pending.reduce((s, e) => s + e.amount, 0);
  return { totalPaid, totalPending, expenseCount: expenses.length, expenses };
}

export async function createExpense(data: Record<string, unknown>, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = await ExpenseModel.create({
    restaurantId: restaurant.id,
    vendorId: data.vendorId ? String(data.vendorId) : undefined,
    category: String(data.category),
    description: String(data.description),
    amount: Number(data.amount),
    currency: String(data.currency ?? "AZN").toUpperCase(),
    date: data.date ? new Date(String(data.date)) : new Date(),
    status: String(data.status ?? "pending").toUpperCase(),
  });
  const e = doc(created.toObject())!;
  await writeAuditLog({ ...auditBase(audit), action: "CREATE", entity: "expense", entityId: e.id });
  return fetchFinanceSummary();
}

export async function deleteExpense(id: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  await ExpenseModel.deleteOne({ _id: id, restaurantId: restaurant.id });
  await writeAuditLog({ ...auditBase(audit), action: "DELETE", entity: "expense", entityId: id });
  return fetchFinanceSummary();
}

// ─── Shifts ─────────────────────────────────────────────────────────────────

export async function fetchShifts() {
  const restaurant = await requireRestaurant();
  await connectDb();
  const shifts = docs(await ShiftModel.find({ restaurantId: restaurant.id }).sort({ date: 1 }).lean());
  const staff = docs(await StaffModel.find({ restaurantId: restaurant.id }).lean());
  const staffMap = new Map(staff.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
  return shifts.map((s) => ({
    id: s.id,
    staffId: s.staffId,
    staffName: staffMap.get(String(s.staffId)) ?? "—",
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    role: s.role,
    notes: s.notes,
  }));
}

export async function createShift(data: Record<string, unknown>, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  const created = await ShiftModel.create({
    restaurantId: restaurant.id,
    staffId: String(data.staffId),
    date: new Date(String(data.date)),
    startTime: String(data.startTime),
    endTime: String(data.endTime),
    role: data.role ? String(data.role) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
  });
  const s = doc(created.toObject())!;
  await writeAuditLog({ ...auditBase(audit), action: "CREATE", entity: "shift", entityId: s.id });
  return fetchShifts();
}

export async function deleteShift(id: string, audit: Omit<AuditInput, "action" | "entity">) {
  const restaurant = await requireRestaurant();
  await connectDb();
  await ShiftModel.deleteOne({ _id: id, restaurantId: restaurant.id });
  await writeAuditLog({ ...auditBase(audit), action: "DELETE", entity: "shift", entityId: id });
  return fetchShifts();
}
