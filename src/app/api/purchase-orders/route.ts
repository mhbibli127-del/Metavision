import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { createPurchaseOrder, fetchPurchaseOrders } from "@/lib/db/growth";

export async function GET() {
  try {
    await requireAccess("reports:read");
    return NextResponse.json({ orders: await fetchPurchaseOrders() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAccess("reports:read");
    const body = await request.json();
    const order = await createPurchaseOrder(body, ctx);
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
