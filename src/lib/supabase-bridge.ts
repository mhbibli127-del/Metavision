import { getSupabaseAdmin } from "@/lib/supabase";
import type { AuditInput } from "@/lib/enterprise/audit";

/** Mirror audit events to Supabase `audit_logs` table when configured (optional backup). */
export async function mirrorAuditToSupabase(input: AuditInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from("audit_logs").insert({
      user_id: input.userId,
      organization_id: input.organizationId,
      branch_id: input.branchId,
      restaurant_id: input.restaurantId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      summary: input.summary,
      metadata: input.metadata ?? null,
      ip: input.ip,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Supabase audit mirror skipped:", err);
  }
}

/** Publish realtime event on Supabase channel when configured. */
export async function publishSupabaseEvent(
  restaurantId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const channel = supabase.channel(`restaurant:${restaurantId}`);
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
    await supabase.removeChannel(channel);
  } catch {
    /* channel may not exist — non-critical */
  }
}

/** Upload file to Supabase Storage bucket `restaurant-assets` when configured. */
export async function uploadToSupabaseStorage(
  path: string,
  body: Buffer | ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { error } = await supabase.storage.from("restaurant-assets").upload(path, body, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("restaurant-assets").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("Supabase storage upload failed:", err);
    return null;
  }
}
