import { NextResponse } from "next/server";
import { getMenuOptimizationSuggestions } from "@/lib/db/menu-optimization";

export async function GET() {
  const suggestions = await getMenuOptimizationSuggestions();
  return NextResponse.json({ suggestions, generatedAt: new Date().toISOString() });
}
