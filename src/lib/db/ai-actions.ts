import { connectDb } from "@/lib/mongodb";
import { AiActionModel, doc, docs } from "@/lib/models";
import { requireRestaurant } from "@/lib/db/session";
import { writeAuditLog, type AuditInput } from "@/lib/enterprise/audit";

export type AiActionRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  impact?: string;
  confidence: number;
  status: string;
};

function mapAction(row: { id: string } & Record<string, unknown>): AiActionRow {
  return {
    id: row.id,
    type: String(row.type),
    title: String(row.title),
    message: String(row.message),
    impact: row.impact ? String(row.impact) : undefined,
    confidence: Number(row.confidence ?? 0.8),
    status: String(row.status ?? "pending"),
  };
}

const MVP_TEMPLATES: Omit<AiActionRow, "id" | "status">[] = [
  {
    type: "demand",
    title: "Pizza tələbatı artıb",
    message: "Pizza sifarişləri bu həftə 32% artıb — axşam menyusuna diqqət yetirin.",
    impact: "+$2.1K potensial gəlir",
    confidence: 0.91,
  },
  {
    type: "pricing",
    title: "Qiymət optimallaşdırması",
    message: "Toyuq wrap satışları 18% düşüb — qiyməti 9→8.2 AZN etməyi tövsiyə edirik.",
    impact: "Həcmi 14% bərpa",
    confidence: 0.78,
  },
  {
    type: "inventory",
    title: "Kritik inventar",
    message: "Aşağı ehtiyat səviyyəsində məhsullar var — təchizat sifarişi yaradın.",
    impact: "Stok-out riskini azaldır",
    confidence: 0.85,
  },
];

export async function ensureMvpActions(restaurantId: string, signals?: { lowStock?: number; pendingOrders?: number }) {
  await connectDb();
  const pending = await AiActionModel.countDocuments({ restaurantId, status: "pending" });
  if (pending > 0) return;

  const templates = [...MVP_TEMPLATES];
  if ((signals?.pendingOrders ?? 0) > 5) {
    templates.unshift({
      type: "operations",
      title: "Mətbəx yüklənməsi",
      message: `${signals!.pendingOrders} gözləyən sifariş — KDS prioritetini artırın.`,
      impact: "Gözləmə vaxtını -12 dəq",
      confidence: 0.88,
    });
  }

  await AiActionModel.insertMany(
    templates.slice(0, 4).map((t) => ({
      restaurantId,
      type: t.type,
      title: t.title,
      message: t.message,
      impact: t.impact,
      confidence: t.confidence,
      status: "pending",
    })),
  );
}

export async function fetchPendingActions(): Promise<AiActionRow[]> {
  const restaurant = await requireRestaurant();
  await connectDb();
  const rows = docs(
    await AiActionModel.find({ restaurantId: restaurant.id, status: "pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  );
  return rows.map(mapAction);
}

export async function resolveAction(
  actionId: string,
  decision: "accept" | "reject",
  audit: Omit<AuditInput, "action" | "entity">,
): Promise<AiActionRow> {
  const restaurant = await requireRestaurant();
  await connectDb();
  const status = decision === "accept" ? "accepted" : "rejected";
  const updated = doc(
    await AiActionModel.findOneAndUpdate(
      { _id: actionId, restaurantId: restaurant.id, status: "pending" },
      { $set: { status, resolvedAt: new Date(), resolvedBy: audit.userId } },
      { new: true },
    ).lean(),
  );
  if (!updated) throw new Error("Action not found");
  await writeAuditLog({
    ...audit,
    action: "UPDATE",
    entity: "ai_action",
    entityId: actionId,
    summary: `AI action ${status}`,
  });
  return mapAction(updated);
}
