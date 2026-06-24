import { NextResponse } from "next/server";
import { getSiteSection } from "@/lib/db/site";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  if (!section) {
    return NextResponse.json({
      sections: ["industries", "partners", "solutions", "timeline"],
    });
  }

  const items = await getSiteSection(section);
  return NextResponse.json({ section, items });
}
