import { connectDb } from "@/lib/mongodb";
import { AuditLogModel } from "@/lib/models";
import { mirrorAuditToSupabase } from "@/lib/supabase-bridge";

export type AuditInput = {
  userId?: string;
  organizationId?: string;
  branchId?: string;
  restaurantId?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await connectDb();
    await AuditLogModel.create({
      userId: input.userId,
      organizationId: input.organizationId,
      branchId: input.branchId,
      restaurantId: input.restaurantId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      ip: input.ip,
    });
    void mirrorAuditToSupabase(input);
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

export async function fetchAuditLogs(restaurantId: string, limit = 50) {
  await connectDb();
  const rows = await AuditLogModel.find({ restaurantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: r._id,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    summary: r.summary,
    createdAt: r.createdAt,
  }));
}
