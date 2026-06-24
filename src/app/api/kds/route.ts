import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchKitchenTickets } from "@/lib/db/kds";
import { updateOrderStatus } from "@/lib/db/orders";

export async function GET() {
  try {
    await requireAccess("orders:read");
    const tickets = await fetchKitchenTickets();
    return NextResponse.json({ tickets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAccess("orders:write");
    const body = (await request.json()) as { orderNumber?: string; status?: string };
    if (!body.orderNumber || !body.status) {
      return NextResponse.json({ error: "orderNumber and status required" }, { status: 400 });
    }
    const uiStatus =
      body.status === "PREPARING" ? "Preparing" : body.status === "READY" ? "Preparing" : body.status === "COMPLETED" ? "Completed" : "Pending";
    const result = await updateOrderStatus(body.orderNumber, uiStatus, ctx);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
