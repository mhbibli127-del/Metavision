import { NextResponse } from "next/server";
import { importMetaAdsCsv, connectWithManualToken } from "@/lib/db/meta-ads";
import type { MetaAdsRange } from "@/lib/meta-ads/types";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const range = (form.get("range") as MetaAdsRange) ?? "30d";
      const currency = String(form.get("currency") ?? "AZN");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "CSV faylı seçin" }, { status: 400 });
      }

      const csvText = await file.text();
      const result = await importMetaAdsCsv(csvText, range, currency);
      return NextResponse.json(result);
    }

    const body = (await request.json()) as {
      accessToken?: string;
      adAccountId?: string;
      currency?: string;
    };

    if (body.accessToken && body.adAccountId) {
      const result = await connectWithManualToken(
        body.accessToken.trim(),
        body.adAccountId.trim(),
        body.currency ?? "AZN",
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Fayl və ya token göndərin" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
