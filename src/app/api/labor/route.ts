import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchLaborAnalytics } from "@/lib/db/growth";

export async function GET() {
  try {
    await requireAccess("reports:read");
    return NextResponse.json(await fetchLaborAnalytics());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
