import { NextResponse } from "next/server";
import { fetchUserSettings, updateUserSettings } from "@/lib/db/settings";

export async function GET() {
  try {
    const settings = await fetchUserSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { emailNotifications, whatsappNotifications, language } = body as {
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
      language?: string;
    };
    await updateUserSettings({ emailNotifications, whatsappNotifications, language });
    return NextResponse.json({ settings: await fetchUserSettings() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
