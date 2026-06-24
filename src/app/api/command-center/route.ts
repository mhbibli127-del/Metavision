import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { fetchOrderStats } from "@/lib/db/dashboard";
import { fetchInventory, fetchCustomers } from "@/lib/db/dashboard";
import { fetchStaff, fetchTables } from "@/lib/db/intelligence";
import { connectDb } from "@/lib/mongodb";
import { OrderModel, ReservationModel, AuditLogModel } from "@/lib/models";
import { buildTasteMindPayload } from "@/lib/db/intelligence";
import { ensureMvpActions, fetchPendingActions, resolveAction } from "@/lib/db/ai-actions";

export async function GET(request: Request) {
  try {
    const ctx = await requireAccess("reports:read");
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") ?? undefined;

    await connectDb();

    const [stats, inventory, customers, staff, tables, tasteMind, recentOrders, upcomingReservations, auditCount] =
      await Promise.all([
        fetchOrderStats(currency as "AZN" | "USD" | "EUR" | undefined),
        fetchInventory(),
        fetchCustomers(),
        fetchStaff(),
        fetchTables(),
        buildTasteMindPayload().catch(() => null),
        OrderModel.find({ userId: ctx.userId }).sort({ createdAt: -1 }).limit(5).lean(),
        ReservationModel.find({ restaurantId: ctx.restaurantId, status: { $ne: "CANCELLED" } })
          .sort({ date: 1 })
          .limit(5)
          .lean(),
        AuditLogModel.countDocuments({ restaurantId: ctx.restaurantId }),
      ]);

    const lowStock = inventory.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").length;
    const occupiedTables = tables.filter((t) => t.status === "Occupied").length;
    const activeStaff = staff.filter((s) => s.status === "active").length;
    const vipCustomers = customers.filter((c) => Number(c.visits) >= 20 || Number(c.totalSpent) >= 500).length;

    await ensureMvpActions(ctx.restaurantId, { lowStock, pendingOrders: stats.pending });
    const actions = await fetchPendingActions();

    return NextResponse.json({
      kpis: {
        revenue: stats.revenue,
        revenueDelta: stats.todayDelta,
        currency: stats.currency,
        ordersTotal: stats.total,
        ordersPending: stats.pending,
        ordersCompleted: stats.completed,
        lowStock,
        occupiedTables,
        tablesTotal: tables.length,
        activeStaff,
        staffTotal: staff.length,
        customersTotal: customers.length,
        vipCustomers,
        auditEvents: auditCount,
      },
      actions,
      alerts: [
        ...(lowStock > 0 ? [{ level: "warning", message: `${lowStock} inventar məhsulu kritik səviyyədə` }] : []),
        ...(stats.pending > 5 ? [{ level: "info", message: `${stats.pending} gözləyən sifariş` }] : []),
      ],
      tasteMind: tasteMind && "predictionCards" in tasteMind
        ? {
            prediction: (tasteMind as { predictionCards?: { message?: string; confidence?: number }[] }).predictionCards?.[0]?.message,
            confidence: (tasteMind as { predictionCards?: { confidence?: number }[] }).predictionCards?.[0]?.confidence,
          }
        : null,
      recentOrders: recentOrders.map((o) => ({
        id: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      upcomingReservations: upcomingReservations.map((r) => ({
        name: r.name,
        partySize: r.partySize,
        date: r.date,
        time: r.time,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAccess("ai:read");
    const body = (await request.json()) as { actionId?: string; decision?: "accept" | "reject" };
    if (!body.actionId || !body.decision) {
      return NextResponse.json({ error: "actionId and decision required" }, { status: 400 });
    }
    const action = await resolveAction(body.actionId, body.decision, ctx);
    return NextResponse.json({ action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Action not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
