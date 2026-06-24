import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { createCampaign, fetchCampaigns, sendCampaign } from "@/lib/db/growth";

export async function GET() {
  try {
    await requireAccess("customers:read");
    return NextResponse.json({ campaigns: await fetchCampaigns() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAccess("customers:write");
    const body = await request.json();
    if (body.action === "send" && body.id) {
      return NextResponse.json(await sendCampaign(String(body.id), ctx));
    }
    const campaign = await createCampaign(body, ctx);
    return NextResponse.json({ campaign });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
