import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { addWaitlistEntry, fetchWaitlist, updateWaitlistStatus } from "@/lib/db/waitlist";
import { convertWaitlistToReservation } from "@/lib/db/growth";

export async function GET() {
  try {
    await requireAccess("reservations:read");
    return NextResponse.json({ waitlist: await fetchWaitlist() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAccess("reservations:write");
    const body = await request.json();
    if (body.action === "convert" && body.id && body.date && body.time) {
      const reservation = await convertWaitlistToReservation(String(body.id), { date: String(body.date), time: String(body.time) }, ctx);
      return NextResponse.json({ reservation });
    }
    const entry = await addWaitlistEntry(body, ctx);
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAccess("reservations:write");
    const body = (await request.json()) as { id?: string; status?: "waiting" | "seated" | "left" };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    const entry = await updateWaitlistStatus(body.id, body.status, ctx);
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Waitlist entry not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
