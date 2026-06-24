import { NextResponse } from "next/server";
import { getAdminClients, getPlatformAnalytics } from "@/lib/db/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "clients";

  try {
    if (resource === "analytics") {
      const analytics = await getPlatformAnalytics();
      return NextResponse.json({ analytics });
    }
    const clients = await getAdminClients();
    return NextResponse.json({ clients });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
