import { NextResponse } from "next/server";
import type { Permission } from "@/lib/enterprise/rbac";
import { requireAccess } from "@/lib/api/access";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
  createTable,
  updateTable,
  deleteTable,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateRestaurantInfo,
} from "@/lib/db/operations";
import {
  fetchMenuItems,
  fetchInventory,
  fetchCustomers,
} from "@/lib/db/dashboard";
import { fetchStaff, fetchTables, fetchRestaurantInfo } from "@/lib/db/intelligence";
import {
  menuItemSchema,
  staffSchema,
  inventorySchema,
  tableSchema,
  customerSchema,
  restaurantSchema,
} from "@/lib/validation/operations";

type RouteCtx = { params: Promise<{ resource: string }> };

const READ_PERM: Record<string, Permission> = {
  menu: "menu:read",
  staff: "staff:read",
  inventory: "inventory:read",
  tables: "tables:read",
  customers: "customers:read",
  restaurant: "restaurant:read",
};

const WRITE_PERM: Record<string, Permission> = {
  menu: "menu:write",
  staff: "staff:write",
  inventory: "inventory:write",
  tables: "tables:write",
  customers: "customers:write",
  restaurant: "restaurant:write",
};

function auditBase(ctx: Awaited<ReturnType<typeof requireAccess>>) {
  return {
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    branchId: ctx.branchId,
    restaurantId: ctx.restaurantId,
    ip: ctx.ip,
  };
}

async function readResource(resource: string) {
  switch (resource) {
    case "menu":
      return { menu: await fetchMenuItems() };
    case "staff":
      return { staff: await fetchStaff() };
    case "inventory":
      return { inventory: await fetchInventory() };
    case "tables":
      return { tables: await fetchTables() };
    case "customers":
      return { customers: await fetchCustomers() };
    case "restaurant":
      return { restaurant: await fetchRestaurantInfo() };
    default:
      throw new Error("Unknown resource");
  }
}

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    const { resource } = await ctx.params;
    const perm = READ_PERM[resource];
    if (!perm) return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    await requireAccess(perm);
    return NextResponse.json(await readResource(resource));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: RouteCtx) {
  try {
    const { resource } = await ctx.params;
    const perm = WRITE_PERM[resource];
    if (!perm) return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    const access = await requireAccess(perm);
    const body = (await request.json()) as Record<string, unknown>;
    const audit = auditBase(access);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    let result: unknown;
    switch (resource) {
      case "menu": {
        const parsed = menuItemSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid menu item" }, { status: 400 });
        result = { menu: await createMenuItem(access.restaurantId, parsed.data, audit) };
        break;
      }
      case "staff": {
        const parsed = staffSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid staff" }, { status: 400 });
        result = { staff: await createStaffMember(access.restaurantId, parsed.data, audit) };
        break;
      }
      case "inventory":
        if (action === "restock" && body.id) {
          result = { inventory: await restockInventoryItem(access.restaurantId, String(body.id), audit) };
        } else {
          const parsed = inventorySchema.safeParse(body);
          if (!parsed.success) return NextResponse.json({ error: "Invalid inventory" }, { status: 400 });
          result = { inventory: await createInventoryItem(access.restaurantId, parsed.data, audit) };
        }
        break;
      case "tables": {
        const parsed = tableSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
        result = { tables: await createTable(access.restaurantId, parsed.data, audit) };
        break;
      }
      case "customers": {
        const parsed = customerSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
        result = { customers: await createCustomer(access.restaurantId, parsed.data, audit) };
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status =
      message === "Unauthorized" ? 401
      : message === "Forbidden" ? 403
      : message === "Table number already exists" ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  try {
    const { resource } = await ctx.params;
    const perm = WRITE_PERM[resource];
    if (!perm) return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    const access = await requireAccess(perm);
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id && resource !== "restaurant") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const audit = auditBase(access);

    let result: unknown;
    switch (resource) {
      case "menu":
        result = { menu: await updateMenuItem(access.restaurantId, id, body, audit) };
        break;
      case "staff":
        result = { staff: await updateStaffMember(access.restaurantId, id, body, audit) };
        break;
      case "inventory":
        result = { inventory: await updateInventoryItem(access.restaurantId, id, body, audit) };
        break;
      case "tables":
        result = { tables: await updateTable(access.restaurantId, id, body, audit) };
        break;
      case "customers":
        result = { customers: await updateCustomer(access.restaurantId, id, body, audit) };
        break;
      case "restaurant": {
        const parsed = restaurantSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid restaurant" }, { status: 400 });
        result = { restaurant: await updateRestaurantInfo(access.restaurantId, parsed.data, audit) };
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  try {
    const { resource } = await ctx.params;
    const perm = WRITE_PERM[resource];
    if (!perm) return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    const access = await requireAccess(perm);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const audit = auditBase(access);

    let result: unknown;
    switch (resource) {
      case "menu":
        result = { menu: await deleteMenuItem(access.restaurantId, id, audit) };
        break;
      case "staff":
        result = { staff: await deleteStaffMember(access.restaurantId, id, audit) };
        break;
      case "inventory":
        result = { inventory: await deleteInventoryItem(access.restaurantId, id, audit) };
        break;
      case "tables":
        result = { tables: await deleteTable(access.restaurantId, id, audit) };
        break;
      case "customers":
        result = { customers: await deleteCustomer(access.restaurantId, id, audit) };
        break;
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
