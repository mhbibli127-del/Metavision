import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchOrganizationProfile, createBranch } from "@/lib/db/organization";
import { branchSchema } from "@/lib/validation/operations";

export async function GET() {
  try {
    await requireAccess("restaurant:read");
    return NextResponse.json(await fetchOrganizationProfile());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAccess("restaurant:write");
    const body = await request.json();
    const parsed = branchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid branch data" }, { status: 400 });
    }
    const profile = await createBranch(parsed.data);
    return NextResponse.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
