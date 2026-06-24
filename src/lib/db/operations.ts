import {
  MenuItemModel,
  StaffModel,
  InventoryModel,
  TableModel,
  CustomerModel,
  RestaurantModel,
  doc,
} from "@/lib/models";
import { connectDb } from "@/lib/mongodb";
import { toJsonString, parseJsonArray } from "@/lib/db/json-fields";
import { fetchMenuItems, fetchInventory, fetchCustomers } from "@/lib/db/dashboard";
import { fetchStaff, fetchTables, fetchRestaurantInfo } from "@/lib/db/intelligence";
import { writeAuditLog, type AuditInput } from "@/lib/enterprise/audit";
import { notifyRestaurantUpdate } from "@/lib/notify";

const STAFF_ROLE_DB: Record<string, string> = {
  manager: "MANAGER",
  chef: "CHEF",
  waiter: "WAITER",
  bartender: "BARTENDER",
  host: "HOST",
  cleaner: "CLEANER",
};

const STAFF_STATUS_DB: Record<string, string> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  on_leave: "ON_LEAVE",
};

const INV_STATUS_DB: Record<string, string> = {
  in_stock: "IN_STOCK",
  low_stock: "LOW_STOCK",
  out_of_stock: "OUT_OF_STOCK",
  discontinued: "DISCONTINUED",
};

const TABLE_STATUS_DB: Record<string, string> = {
  Available: "AVAILABLE",
  Occupied: "OCCUPIED",
  Reserved: "RESERVED",
};

const TABLE_ZONE_DB: Record<string, string> = {
  Garden: "INDOOR",
  Terrace: "TERRACE",
  VIP: "VIP",
};

function auditCtx(base: AuditInput, ctx: Omit<AuditInput, "action" | "entity">) {
  return { ...ctx, ...base };
}

async function emitOpsEvent(restaurantId: string, entity: string, action: string, id?: string) {
  await notifyRestaurantUpdate(restaurantId, `${entity}.updated`, { action, id });
}

// ─── Menu ───────────────────────────────────────────────────────────────────

export async function createMenuItem(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const created = await MenuItemModel.create({
    restaurantId,
    name: String(data.name ?? ""),
    category: String(data.category ?? "mains"),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    image: data.image ? String(data.image) : undefined,
    available: data.available !== false,
    featured: Boolean(data.featured),
    preparationTime: Number(data.preparationTime ?? 15),
    calories: data.calories != null ? Number(data.calories) : undefined,
    tags: toJsonString(Array.isArray(data.tags) ? data.tags : []),
    order: Number(data.order ?? 0),
  });
  const item = doc(created.toObject())!;
  await writeAuditLog(
    auditCtx({ action: "CREATE", entity: "menu", entityId: item.id, summary: `Menu: ${item.name}` }, audit),
  );
  await emitOpsEvent(restaurantId, "menu", "create", item.id);
  return fetchMenuItems();
}

export async function updateMenuItem(
  restaurantId: string,
  id: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const patch: Record<string, unknown> = {};
  if (data.name != null) patch.name = String(data.name);
  if (data.category != null) patch.category = String(data.category);
  if (data.description != null) patch.description = String(data.description);
  if (data.price != null) patch.price = Number(data.price);
  if (data.available != null) patch.available = Boolean(data.available);
  if (data.featured != null) patch.featured = Boolean(data.featured);
  if (data.preparationTime != null) patch.preparationTime = Number(data.preparationTime);
  if (data.tags != null) patch.tags = toJsonString(data.tags as string[]);
  await MenuItemModel.findOneAndUpdate({ _id: id, restaurantId }, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "menu", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "menu", "update", id);
  return fetchMenuItems();
}

export async function deleteMenuItem(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  await MenuItemModel.deleteOne({ _id: id, restaurantId });
  await writeAuditLog(auditCtx({ action: "DELETE", entity: "menu", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "menu", "delete", id);
  return fetchMenuItems();
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export async function createStaffMember(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const roleKey = String(data.role ?? "waiter").toLowerCase();
  const statusKey = String(data.status ?? "active").toLowerCase();
  const created = await StaffModel.create({
    restaurantId,
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    phone: String(data.phone ?? ""),
    email: data.email ? String(data.email) : undefined,
    role: STAFF_ROLE_DB[roleKey] ?? "WAITER",
    status: STAFF_STATUS_DB[statusKey] ?? "ACTIVE",
    hireDate: data.hireDate ? new Date(String(data.hireDate)) : new Date(),
    salary: data.salary != null ? Number(data.salary) : undefined,
  });
  const s = doc(created.toObject())!;
  await writeAuditLog(
    auditCtx({ action: "CREATE", entity: "staff", entityId: s.id, summary: `${s.firstName} ${s.lastName}` }, audit),
  );
  await emitOpsEvent(restaurantId, "staff", "create", s.id);
  return fetchStaff();
}

export async function updateStaffMember(
  restaurantId: string,
  id: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const patch: Record<string, unknown> = {};
  if (data.firstName != null) patch.firstName = String(data.firstName);
  if (data.lastName != null) patch.lastName = String(data.lastName);
  if (data.phone != null) patch.phone = String(data.phone);
  if (data.email != null) patch.email = String(data.email);
  if (data.role != null) patch.role = STAFF_ROLE_DB[String(data.role).toLowerCase()] ?? "WAITER";
  if (data.status != null) patch.status = STAFF_STATUS_DB[String(data.status).toLowerCase()] ?? "ACTIVE";
  if (data.salary != null) patch.salary = Number(data.salary);
  if (data.hireDate != null) patch.hireDate = new Date(String(data.hireDate));
  await StaffModel.findOneAndUpdate({ _id: id, restaurantId }, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "staff", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "staff", "update", id);
  return fetchStaff();
}

export async function deleteStaffMember(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  await StaffModel.deleteOne({ _id: id, restaurantId });
  await writeAuditLog(auditCtx({ action: "DELETE", entity: "staff", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "staff", "delete", id);
  return fetchStaff();
}

// ─── Inventory ──────────────────────────────────────────────────────────────

function inventoryStatusFromQty(quantity: number, minQuantity: number): string {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity < minQuantity) return "LOW_STOCK";
  return "IN_STOCK";
}

export async function createInventoryItem(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const quantity = Number(data.quantity ?? 0);
  const minQuantity = Number(data.minQuantity ?? 10);
  const statusKey = data.status ? INV_STATUS_DB[String(data.status)] : inventoryStatusFromQty(quantity, minQuantity);
  const created = await InventoryModel.create({
    restaurantId,
    name: String(data.name ?? ""),
    category: String(data.category ?? "Other"),
    quantity,
    unit: String(data.unit ?? "kg"),
    minQuantity,
    costPerUnit: Number(data.costPerUnit ?? 0),
    supplier: data.supplier ? String(data.supplier) : undefined,
    lastRestocked: data.lastRestocked ? new Date(String(data.lastRestocked)) : undefined,
    status: statusKey ?? "IN_STOCK",
  });
  const item = doc(created.toObject())!;
  await writeAuditLog(auditCtx({ action: "CREATE", entity: "inventory", entityId: item.id }, audit));
  await emitOpsEvent(restaurantId, "inventory", "create", item.id);
  return fetchInventory();
}

export async function updateInventoryItem(
  restaurantId: string,
  id: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const existing = await InventoryModel.findOne({ _id: id, restaurantId }).lean();
  if (!existing) throw new Error("Not found");
  const patch: Record<string, unknown> = {};
  if (data.name != null) patch.name = String(data.name);
  if (data.category != null) patch.category = String(data.category);
  if (data.quantity != null) patch.quantity = Number(data.quantity);
  if (data.unit != null) patch.unit = String(data.unit);
  if (data.minQuantity != null) patch.minQuantity = Number(data.minQuantity);
  if (data.costPerUnit != null) patch.costPerUnit = Number(data.costPerUnit);
  if (data.supplier != null) patch.supplier = String(data.supplier);
  if (data.lastRestocked != null) patch.lastRestocked = new Date(String(data.lastRestocked));
  const qty = data.quantity != null ? Number(data.quantity) : Number(existing.quantity);
  const minQ = data.minQuantity != null ? Number(data.minQuantity) : Number(existing.minQuantity);
  if (data.status != null) {
    patch.status = INV_STATUS_DB[String(data.status)] ?? inventoryStatusFromQty(qty, minQ);
  } else if (data.quantity != null || data.minQuantity != null) {
    patch.status = inventoryStatusFromQty(qty, minQ);
  }
  await InventoryModel.findOneAndUpdate({ _id: id, restaurantId }, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "inventory", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "inventory", "update", id);
  return fetchInventory();
}

export async function deleteInventoryItem(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  await InventoryModel.deleteOne({ _id: id, restaurantId });
  await writeAuditLog(auditCtx({ action: "DELETE", entity: "inventory", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "inventory", "delete", id);
  return fetchInventory();
}

export async function restockInventoryItem(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const existing = await InventoryModel.findOne({ _id: id, restaurantId }).lean();
  if (!existing) throw new Error("Not found");
  const quantity = Number(existing.quantity) + Number(existing.minQuantity);
  const status = inventoryStatusFromQty(quantity, Number(existing.minQuantity));
  await InventoryModel.findOneAndUpdate(
    { _id: id, restaurantId },
    { $set: { quantity, status, lastRestocked: new Date() } },
  );
  await writeAuditLog(auditCtx({ action: "RESTOCK", entity: "inventory", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "inventory", "restock", id);
  return fetchInventory();
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export async function createTable(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const number = String(data.number ?? "").trim();
  const exists = await TableModel.exists({ restaurantId, number });
  if (exists) throw new Error("Table number already exists");
  const statusKey = String(data.status ?? "Available");
  const zoneKey = String(data.zone ?? "Garden");
  const created = await TableModel.create({
    restaurantId,
    number,
    capacity: Number(data.seats ?? data.capacity ?? 4),
    zone: TABLE_ZONE_DB[zoneKey] ?? "INDOOR",
    status: TABLE_STATUS_DB[statusKey] ?? "AVAILABLE",
  });
  const t = doc(created.toObject())!;
  await writeAuditLog(auditCtx({ action: "CREATE", entity: "table", entityId: t.id }, audit));
  await emitOpsEvent(restaurantId, "table", "create", t.id);
  return fetchTables();
}

export async function updateTable(
  restaurantId: string,
  id: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const patch: Record<string, unknown> = {};
  if (data.number != null) patch.number = String(data.number);
  if (data.seats != null || data.capacity != null) patch.capacity = Number(data.seats ?? data.capacity);
  if (data.status != null) patch.status = TABLE_STATUS_DB[String(data.status)] ?? "AVAILABLE";
  if (data.zone != null) patch.zone = TABLE_ZONE_DB[String(data.zone)] ?? "INDOOR";
  if (data.posX != null) patch.posX = Number(data.posX);
  if (data.posY != null) patch.posY = Number(data.posY);
  if (data.width != null) patch.width = Number(data.width);
  if (data.height != null) patch.height = Number(data.height);
  await TableModel.findOneAndUpdate({ _id: id, restaurantId }, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "table", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "table", "update", id);
  return fetchTables();
}

export async function deleteTable(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  await TableModel.deleteOne({ _id: id, restaurantId });
  await writeAuditLog(auditCtx({ action: "DELETE", entity: "table", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "table", "delete", id);
  return fetchTables();
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function createCustomer(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const created = await CustomerModel.create({
    restaurantId,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    email: data.email ? String(data.email) : undefined,
    visits: Number(data.visits ?? 0),
    totalSpent: Number(data.totalSpent ?? 0),
    notes: data.notes ? String(data.notes) : undefined,
  });
  const c = doc(created.toObject())!;
  await writeAuditLog(auditCtx({ action: "CREATE", entity: "customer", entityId: c.id }, audit));
  await emitOpsEvent(restaurantId, "customer", "create", c.id);
  return fetchCustomers();
}

export async function updateCustomer(
  restaurantId: string,
  id: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const patch: Record<string, unknown> = {};
  if (data.name != null) patch.name = String(data.name);
  if (data.phone != null) patch.phone = String(data.phone);
  if (data.email != null) patch.email = String(data.email);
  if (data.visits != null) patch.visits = Number(data.visits);
  if (data.totalSpent != null) patch.totalSpent = Number(data.totalSpent);
  if (data.notes != null) patch.notes = String(data.notes);
  await CustomerModel.findOneAndUpdate({ _id: id, restaurantId }, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "customer", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "customer", "update", id);
  return fetchCustomers();
}

export async function deleteCustomer(
  restaurantId: string,
  id: string,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  await CustomerModel.deleteOne({ _id: id, restaurantId });
  await writeAuditLog(auditCtx({ action: "DELETE", entity: "customer", entityId: id }, audit));
  await emitOpsEvent(restaurantId, "customer", "delete", id);
  return fetchCustomers();
}

// ─── Restaurant ─────────────────────────────────────────────────────────────

export async function updateRestaurantInfo(
  restaurantId: string,
  data: Record<string, unknown>,
  audit: Omit<AuditInput, "action" | "entity">,
) {
  await connectDb();
  const patch: Record<string, unknown> = {};
  for (const key of [
    "address", "openingHours", "phone", "email", "website",
    "parking", "amenities", "activeCampaigns", "name", "city",
  ]) {
    if (data[key] != null) patch[key] = String(data[key]);
  }
  if (data.paymentMethods != null) {
    patch.paymentMethods = toJsonString(
      Array.isArray(data.paymentMethods) ? data.paymentMethods : parseJsonArray(String(data.paymentMethods)),
    );
  }
  if (data.imageName != null) patch.imageName = String(data.imageName);
  await RestaurantModel.findByIdAndUpdate(restaurantId, { $set: patch });
  await writeAuditLog(auditCtx({ action: "UPDATE", entity: "restaurant", entityId: restaurantId }, audit));
  await emitOpsEvent(restaurantId, "restaurant", "update", restaurantId);
  return fetchRestaurantInfo();
}
