import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { listIntegrations } from "@/lib/db/integrations";

export async function GET() {
  try {
    await requireAccess("restaurant:read");
    const connections = await listIntegrations();
    return NextResponse.json({ connections });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
