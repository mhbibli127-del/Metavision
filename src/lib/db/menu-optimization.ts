import { tryConnectDb } from "@/lib/mongodb";
import { MenuItemModel, OrderModel, InventoryModel, docs } from "@/lib/models";
import { getUserRestaurant } from "@/lib/db/session";
import { fetchMarketTrends } from "@/lib/db/market";

export type MenuPriceSuggestion = {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  suggestedPrice: number;
  changePct: number;
  marginPct: number;
  demandScore: number;
  reason: string;
  confidence: number;
};

/** Marja + tələb əsasında qiymət tövsiyələri */
export async function getMenuOptimizationSuggestions(): Promise<MenuPriceSuggestion[]> {
  const restaurant = await getUserRestaurant();
  if (!restaurant || !(await tryConnectDb())) return [];

  const [menuItems, orders, inventory, trends] = await Promise.all([
    docs(await MenuItemModel.find({ restaurantId: restaurant.id, available: true }).lean()),
    docs(await OrderModel.find({ userId: restaurant.userId }).lean()),
    docs(await InventoryModel.find({ restaurantId: restaurant.id }).lean()),
    fetchMarketTrends(restaurant.city),
  ]);

  const demand = new Map<string, number>();
  for (const o of orders) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const item of items) {
      const id = String((item as { menuItemId?: string }).menuItemId);
      demand.set(id, (demand.get(id) ?? 0) + Number((item as { quantity?: unknown }).quantity ?? 1));
    }
  }

  const maxDemand = Math.max(1, ...demand.values());
  const topTrend = trends[0];
  const marketBoost = topTrend ? topTrend.momentum / 100 : 0.5;

  const suggestions: MenuPriceSuggestion[] = [];

  for (const m of menuItems) {
    const row = m as Record<string, unknown>;
    const id = String(row.id);
    const name = String(row.name);
    const category = String(row.category);
    const currentPrice = Number(row.price);
    const qtySold = demand.get(id) ?? 0;
    const demandScore = Math.round((qtySold / maxDemand) * 100);

    const invMatch = inventory.find((i) =>
      String((i as Record<string, unknown>).name)
        .toLowerCase()
        .includes(name.split(" ")[0]?.toLowerCase() ?? ""),
    );
    const cost = invMatch
      ? Number((invMatch as Record<string, unknown>).costPerUnit) * 2.5
      : currentPrice * 0.38;
    const marginPct = currentPrice > 0 ? Math.round(((currentPrice - cost) / currentPrice) * 100) : 0;

    let suggestedPrice = currentPrice;
    let reason = "Qiymət balanslıdır";
    let confidence = 72;

    if (demandScore >= 70 && marginPct < 45) {
      suggestedPrice = currentPrice * (1.08 + marketBoost * 0.05);
      reason = "Yüksək tələb, aşağı marja — qiymət artımı tövsiyə olunur";
      confidence = 88;
    } else if (demandScore < 25 && marginPct > 55) {
      suggestedPrice = currentPrice * 0.92;
      reason = "Aşağı satış, yüksək marja — promosiya qiyməti";
      confidence = 81;
    } else if (demandScore >= 50 && marginPct >= 45 && marginPct <= 55) {
      suggestedPrice = currentPrice * 1.04;
      reason = "Stabil tələb — kiçik optimallaşdırma";
      confidence = 76;
    } else if (category === "desserts" && demandScore < 40) {
      suggestedPrice = currentPrice * 0.95;
      reason = "Desert kateqoriyasında rəqabət — cəlbedici qiymət";
      confidence = 70;
    }

    suggestedPrice = Math.round(suggestedPrice * 100) / 100;
    const changePct = currentPrice > 0 ? Math.round(((suggestedPrice - currentPrice) / currentPrice) * 100) : 0;

    if (Math.abs(changePct) >= 2) {
      suggestions.push({
        id,
        name,
        category,
        currentPrice,
        suggestedPrice,
        changePct,
        marginPct,
        demandScore,
        reason,
        confidence,
      });
    }
  }

  return suggestions.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}
