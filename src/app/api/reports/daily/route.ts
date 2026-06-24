import { NextResponse } from "next/server";
import { buildTasteMindPayload } from "@/lib/db/intelligence";
import { fetchPaymentAnalytics } from "@/lib/db/payment-analytics";
import { getMenuOptimizationSuggestions } from "@/lib/db/menu-optimization";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const [intel, payments, menu] = await Promise.all([
    buildTasteMindPayload().catch(() => null),
    fetchPaymentAnalytics("AZN"),
    getMenuOptimizationSuggestions().catch(() => []),
  ]);

  const report = {
    title: "TasteMind Günlük Hesabat",
    date: new Date().toLocaleDateString("az-AZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    ops: intel?.opsSnapshot ?? null,
    predictions: intel?.predictionCards?.slice(0, 4) ?? [],
    incidents: intel?.incidents?.slice(0, 5) ?? [],
    payments,
    menuSuggestions: menu.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };

  if (format === "html") {
    const html = `<!DOCTYPE html><html lang="az"><head><meta charset="utf-8"/><title>${report.title}</title>
<style>body{font-family:Inter,system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#111}
h1{font-size:24px}h2{font-size:16px;margin-top:28px;color:#444}.kpi{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:14px}table{width:100%;border-collapse:collapse;margin-top:12px}
td,th{border-bottom:1px solid #eee;padding:8px;text-align:left;font-size:13px}@media print{body{margin:0}}</style></head><body>
<h1>${report.title}</h1><p>${report.date}</p>
${report.ops ? `<div class="kpi">
<div class="card"><strong>Günlük gəlir</strong><br/>${report.ops.revenue} ${report.ops.currency}</div>
<div class="card"><strong>Sifariş</strong><br/>${report.ops.todayOrderCount} bu gün</div>
<div class="card"><strong>Rezerv</strong><br/>${report.ops.activeReservations}</div>
<div class="card"><strong>Anbar</strong><br/>${report.ops.lowStockCount} xəbərdarlıq</div></div>` : ""}
<h2>Ödənişlər</h2><table><tr><th>Metod</th><th>Sayı</th><th>Gəlir</th><th>%</th></tr>
${report.payments.paymentMethods.map((p) => `<tr><td>${p.label}</td><td>${p.count}</td><td>${p.revenue} AZN</td><td>${p.share}%</td></tr>`).join("")}
</table>
<h2>Qiymət tövsiyələri</h2><table><tr><th>Məhsul</th><th>Cari</th><th>Tövsiyə</th><th>Səbəb</th></tr>
${report.menuSuggestions.map((m) => `<tr><td>${m.name}</td><td>${m.currentPrice}</td><td>${m.suggestedPrice}</td><td>${m.reason}</td></tr>`).join("")}
</table>
<p style="margin-top:40px;color:#888;font-size:12px">Metavision TasteMind · ${report.generatedAt}</p>
<script>window.onload=()=>window.print()</script></body></html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(report);
}
