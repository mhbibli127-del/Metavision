import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchAuditLogs } from "@/lib/enterprise/audit";

export async function GET() {
  try {
    const ctx = await requireAccess("reports:read");
    const logs = await fetchAuditLogs(ctx.restaurantId);
    return NextResponse.json({ logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
