import { publishRealtimeEvent } from "@/lib/realtime";
import { publishSupabaseEvent } from "@/lib/supabase-bridge";

export async function notifyRestaurantUpdate(
  restaurantId: string,
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const body = { ...payload, at: new Date().toISOString() };
  await publishRealtimeEvent(event, restaurantId, body);
  void publishSupabaseEvent(restaurantId, event, body);
}
