import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchCustomerSegments } from "@/lib/db/customer-segments";

export async function GET() {
  try {
    await requireAccess("customers:read");
    return NextResponse.json(await fetchCustomerSegments());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
