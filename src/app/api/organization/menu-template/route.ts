import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { copyMenuTemplate } from "@/lib/db/organization";
import { z } from "zod";

const schema = z.object({
  sourceRestaurantId: z.string().min(1),
  targetRestaurantId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireAccess("menu:write");
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await copyMenuTemplate(parsed.data.sourceRestaurantId, parsed.data.targetRestaurantId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
