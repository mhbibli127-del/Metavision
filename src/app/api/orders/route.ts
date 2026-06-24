import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { updateOrderStatus } from "@/lib/db/orders";
import { fetchOrdersForUser } from "@/lib/db/dashboard";
import { invalidateOrderStatsCache } from "@/lib/cache/stats-cache";
import type { Currency } from "@/lib/prisma-types";
import { z } from "zod";

const schema = z.object({
  orderNumber: z.string().min(1),
  status: z.enum(["Pending", "Preparing", "Completed", "Cancelled"]),
});

export async function GET(request: Request) {
  try {
    await requireAccess("orders:read");
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") as Currency | null;
    const orders = await fetchOrdersForUser(currency ?? undefined);
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAccess("orders:write");
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await updateOrderStatus(parsed.data.orderNumber, parsed.data.status, {
      userId: access.userId,
      restaurantId: access.restaurantId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      ip: access.ip,
    });
    await invalidateOrderStatsCache(access.userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Order not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
