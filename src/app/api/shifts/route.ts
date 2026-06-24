import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchShifts, createShift, deleteShift } from "@/lib/db/finance";
import { shiftSchema } from "@/lib/validation/operations";

export async function GET() {
  try {
    await requireAccess("staff:read");
    return NextResponse.json({ shifts: await fetchShifts() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess("staff:write");
    const body = await request.json();
    const parsed = shiftSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid shift" }, { status: 400 });
    const shifts = await createShift(parsed.data, {
      userId: access.userId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      restaurantId: access.restaurantId,
      ip: access.ip,
    });
    return NextResponse.json({ shifts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireAccess("staff:write");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const shifts = await deleteShift(id, {
      userId: access.userId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      restaurantId: access.restaurantId,
      ip: access.ip,
    });
    return NextResponse.json({ shifts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
