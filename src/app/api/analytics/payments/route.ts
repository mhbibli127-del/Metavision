import { NextResponse } from "next/server";
import { fetchPaymentAnalytics } from "@/lib/db/payment-analytics";
import type { Currency } from "@/lib/prisma-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get("currency") ?? "AZN") as Currency;
  const data = await fetchPaymentAnalytics(currency);
  return NextResponse.json(data);
}
