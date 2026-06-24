import { NextResponse } from "next/server";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db/notifications";

export async function GET() {
  try {
    const notifications = await fetchNotifications();
    return NextResponse.json({ notifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; all?: boolean; read?: boolean };
    if (body.all) {
      await markAllNotificationsRead();
      return NextResponse.json({ ok: true });
    }
    if (body.id) {
      await markNotificationRead(body.id, body.read ?? true);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "id or all required" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteNotification(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
