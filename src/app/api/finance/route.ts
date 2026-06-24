import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import {
  fetchFinanceSummary,
  fetchVendors,
  createVendor,
  deleteVendor,
  createExpense,
  deleteExpense,
} from "@/lib/db/finance";
import { vendorSchema, expenseSchema } from "@/lib/validation/operations";

export async function GET() {
  try {
    await requireAccess("reports:read");
    const [summary, vendors] = await Promise.all([fetchFinanceSummary(), fetchVendors()]);
    return NextResponse.json({ ...summary, vendors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess("restaurant:write");
    const body = await request.json();
    const audit = {
      userId: access.userId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      restaurantId: access.restaurantId,
      ip: access.ip,
    };
    const type = String(body.type ?? "expense");
    if (type === "vendor") {
      const parsed = vendorSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid vendor" }, { status: 400 });
      const vendors = await createVendor(parsed.data, audit);
      return NextResponse.json({ vendors });
    }
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid expense" }, { status: 400 });
    const summary = await createExpense(parsed.data, audit);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireAccess("restaurant:write");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") ?? "expense";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const audit = {
      userId: access.userId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      restaurantId: access.restaurantId,
      ip: access.ip,
    };
    if (type === "vendor") {
      const vendors = await deleteVendor(id, audit);
      return NextResponse.json({ vendors });
    }
    const summary = await deleteExpense(id, audit);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
