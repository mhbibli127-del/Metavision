import { NextResponse } from "next/server";
import { createReservation, updateReservationStatus } from "@/lib/db/reservations";
import { updateReservationDeposit, sendReservationReminder } from "@/lib/db/growth";
import { fetchReservations } from "@/lib/db/dashboard";
import { requireAccess } from "@/lib/api/access";

export async function GET() {
  try {
    const reservations = await fetchReservations();
    return NextResponse.json({ reservations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAccess("reservations:write");
    const body = await request.json();
    const reservation = await createReservation(body as Parameters<typeof createReservation>[0], {
      userId: ctx.userId,
      restaurantId: ctx.restaurantId,
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
      ip: ctx.ip,
    });
    return NextResponse.json({ reservation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAccess("reservations:write");
    const body = (await request.json()) as {
      id?: string;
      status?: "Confirmed" | "Cancelled";
      depositAmount?: number;
      depositPaid?: boolean;
      action?: "reminder";
    };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (body.action === "reminder") {
      return NextResponse.json(await sendReservationReminder(body.id, ctx));
    }
    if (body.depositAmount != null) {
      const row = await updateReservationDeposit(body.id, body.depositAmount, Boolean(body.depositPaid), ctx);
      return NextResponse.json({ reservation: row });
    }
    if (!body.status) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }
    const reservation = await updateReservationStatus(body.id, body.status, {
      userId: ctx.userId,
      restaurantId: ctx.restaurantId,
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
      ip: ctx.ip,
    });
    return NextResponse.json({ reservation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message === "Reservation not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
