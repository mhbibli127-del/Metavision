import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { updateTable } from "@/lib/db/operations";
import { mergeTables, splitTable } from "@/lib/db/growth";

export async function POST(request: Request) {
  try {
    const ctx = await requireAccess("tables:write");
    const body = (await request.json()) as {
      action?: string;
      primaryId?: string;
      secondaryId?: string;
      tableId?: string;
    };
    if (body.action === "split" && body.tableId) {
      return NextResponse.json(await splitTable(body.tableId, ctx));
    }
    if (!body.primaryId || !body.secondaryId) {
      return NextResponse.json({ error: "primaryId and secondaryId required" }, { status: 400 });
    }
    return NextResponse.json(await mergeTables(body.primaryId, body.secondaryId, ctx));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAccess("tables:write");
    const body = (await request.json()) as {
      id: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const tables = await updateTable(ctx.restaurantId, body.id, body, ctx);
    return NextResponse.json({ tables });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
