import { tryConnectDb } from "@/lib/mongodb";
import { OrderModel, docs } from "@/lib/models";
import { getDbUser, getUserRestaurant } from "@/lib/db/session";
import { convertCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/prisma-types";

export type PaymentMethod = "card" | "cash" | "apple_pay" | "qr" | "other";

export async function fetchPaymentAnalytics(displayCurrency: Currency = "AZN") {
  const user = await getDbUser();
  if (!user || !(await tryConnectDb())) {
    return emptyAnalytics(displayCurrency);
  }

  const orders = docs(await OrderModel.find({ userId: user.id }).lean());
  const restaurant = await getUserRestaurant();
  const baseCurrency = (restaurant?.currency ?? "AZN") as Currency;

  const byMethod = new Map<string, { count: number; revenue: number }>();
  const byCurrency = new Map<string, { count: number; revenue: number }>();
  let totalRevenue = 0;

  for (const o of orders) {
    const row = o as Record<string, unknown>;
    const method = String(row.paymentMethod ?? "card");
    const cur = String(row.currency ?? baseCurrency);
    let amount = Number(row.total);

    if (displayCurrency !== cur) {
      amount = (await convertCurrency(amount, cur as Currency, displayCurrency)).amount;
    } else if (displayCurrency !== baseCurrency && cur === baseCurrency) {
      amount = (await convertCurrency(amount, baseCurrency, displayCurrency)).amount;
    }

    totalRevenue += amount;

    const m = byMethod.get(method) ?? { count: 0, revenue: 0 };
    m.count += 1;
    m.revenue += amount;
    byMethod.set(method, m);

    const c = byCurrency.get(cur) ?? { count: 0, revenue: 0 };
    c.count += 1;
    c.revenue += amount;
    byCurrency.set(cur, c);
  }

  const paymentMethods = [...byMethod.entries()].map(([method, v]) => ({
    method,
    label: methodLabel(method),
    count: v.count,
    revenue: Math.round(v.revenue * 100) / 100,
    share: totalRevenue > 0 ? Math.round((v.revenue / totalRevenue) * 100) : 0,
  }));

  const currencies = [...byCurrency.entries()].map(([currency, v]) => ({
    currency,
    count: v.count,
    revenue: Math.round(v.revenue * 100) / 100,
    share: totalRevenue > 0 ? Math.round((v.revenue / totalRevenue) * 100) : 0,
  }));

  return {
    displayCurrency,
    totalOrders: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paymentMethods: paymentMethods.sort((a, b) => b.revenue - a.revenue),
    currencies: currencies.sort((a, b) => b.revenue - a.revenue),
    topMethod: paymentMethods[0]?.method ?? "card",
  };
}

function methodLabel(m: string) {
  const map: Record<string, string> = {
    card: "Kart",
    cash: "Nağd",
    apple_pay: "Apple Pay",
    qr: "QR / Kapital",
    other: "Digər",
  };
  return map[m] ?? m;
}

function emptyAnalytics(currency: Currency) {
  return {
    displayCurrency: currency,
    totalOrders: 0,
    totalRevenue: 0,
    paymentMethods: [],
    currencies: [],
    topMethod: "card",
  };
}
