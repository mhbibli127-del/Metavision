import { NextResponse } from "next/server";
import { buildAzMapPayload } from "@/lib/az-map";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId") ?? "baku";
  const data = await buildAzMapPayload(cityId);
  return NextResponse.json(data);
}
